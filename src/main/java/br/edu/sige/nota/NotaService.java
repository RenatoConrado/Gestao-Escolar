package br.edu.sige.nota;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.aluno.Aluno;
import br.edu.sige.aluno.AlunoRepository;
import br.edu.sige.atribuicao.AtribuicaoDocente;
import br.edu.sige.auditoria.AcaoAuditoria;
import br.edu.sige.auditoria.AuditoriaService;
import br.edu.sige.avaliacao.Avaliacao;
import br.edu.sige.avaliacao.AvaliacaoRepository;
import br.edu.sige.common.ApiException;
import br.edu.sige.matricula.MatriculaRepository;
import br.edu.sige.matricula.SituacaoMatricula;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.UsuarioAutenticado;
import br.edu.sige.turma.Turma;
import br.edu.sige.turma.TurmaRepository;
import lombok.RequiredArgsConstructor;

/**
 * Diário de classe - notas. O PROFESSOR só lança/altera notas de avaliações vinculadas a uma atribuição docente
 * ATIVA em seu nome ({@link AcessoService#exigirEscritaNaAtribuicao}); nunca confia em IDs enviados no payload.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotaService {

    private final NotaRepository notas;
    private final AvaliacaoRepository avaliacoes;
    private final AlunoRepository alunos;
    private final TurmaRepository turmas;
    private final MatriculaRepository matriculas;
    private final AcessoService acesso;
    private final AuditoriaService auditoria;

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
    public Page<NotaResponse> listarPorTurma(Long turmaId, Pageable pageable) {
        Turma turma = turmas.findComEscolaById(turmaId)
                .orElseThrow(() -> ApiException.naoEncontrado("Turma", turmaId));
        acesso.exigirLeituraDaTurma(turma);
        UsuarioAutenticado u = acesso.usuario();
        Page<Nota> pagina = u.perfil() == PerfilNome.PROFESSOR
                ? notas.findPorTurmaDoProfessor(turmaId, u.id(), pageable)
                : notas.findPorTurma(turmaId, pageable);
        return pagina.map(NotaResponse::from);
    }

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
    public Page<NotaResponse> listarPorAvaliacao(Long avaliacaoId, Pageable pageable) {
        Avaliacao av = avaliacao(avaliacaoId);
        acesso.exigirLeituraDaAtribuicao(av.getAtribuicao());
        return notas.findByAvaliacaoId(avaliacaoId, pageable).map(NotaResponse::from);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    public NotaResponse lancar(NotaRequest req) {
        Avaliacao av = avaliacao(req.avaliacaoId());
        AtribuicaoDocente atribuicao = av.getAtribuicao();
        acesso.exigirEscritaNaAtribuicao(atribuicao);
        exigirAtribuicaoAtiva(atribuicao);
        validarValor(req.valor(), av);
        if (!matriculas.existsByAlunoIdAndTurmaIdAndSituacao(
                req.alunoId(), atribuicao.getTurma().getId(), SituacaoMatricula.ATIVA)) {
            throw ApiException.regraDeNegocio("O aluno não possui matrícula ativa na turma desta avaliação.");
        }
        if (notas.existsByAlunoIdAndAvaliacaoId(req.alunoId(), av.getId())) {
            throw ApiException.conflito("Já existe nota lançada para este aluno nesta avaliação.");
        }
        Aluno aluno = alunos.findById(req.alunoId())
                .orElseThrow(() -> ApiException.naoEncontrado("Aluno", req.alunoId()));
        Nota n = new Nota();
        n.setAluno(aluno);
        n.setAvaliacao(av);
        n.setValor(req.valor());
        Nota salva = notas.save(n);
        auditoria.registrar("NOTA", salva.getId(), AcaoAuditoria.CRIACAO,
                "aluno=" + aluno.getId() + ", avaliacao=" + av.getId() + ", valor=" + req.valor());
        return NotaResponse.from(salva);
    }

    /** SECRETARIO pode corrigir (alteração excepcional) apenas na sua escola. */
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR')")
    public NotaResponse atualizar(Long id, NotaUpdateRequest req) {
        Nota n = obter(id);
        AtribuicaoDocente atribuicao = n.getAvaliacao().getAtribuicao();
        acesso.exigirEscritaNaAtribuicao(atribuicao);
        exigirAtribuicaoAtiva(atribuicao);
        validarValor(req.valor(), n.getAvaliacao());
        BigDecimal anterior = n.getValor();
        n.setValor(req.valor());
        auditoria.registrar("NOTA", id, AcaoAuditoria.ATUALIZACAO,
                "aluno=" + n.getAluno().getId() + ", avaliacao=" + n.getAvaliacao().getId()
                        + ", valor: " + anterior + " -> " + req.valor());
        return NotaResponse.from(n);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    public void excluir(Long id) {
        Nota n = obter(id);
        AtribuicaoDocente atribuicao = n.getAvaliacao().getAtribuicao();
        acesso.exigirEscritaNaAtribuicao(atribuicao);
        exigirAtribuicaoAtiva(atribuicao);
        auditoria.registrar("NOTA", id, AcaoAuditoria.EXCLUSAO,
                "aluno=" + n.getAluno().getId() + ", avaliacao=" + n.getAvaliacao().getId() + ", valor=" + n.getValor());
        notas.delete(n);
    }

    private void exigirAtribuicaoAtiva(AtribuicaoDocente atribuicao) {
        acesso.exigirAtribuicaoAtiva(atribuicao);
        if (!atribuicao.isAtivo()) {
            throw ApiException.regraDeNegocio("A atribuição docente está inativa.");
        }
    }

    private void validarValor(BigDecimal valor, Avaliacao av) {
        if (valor.compareTo(av.getValorMaximo()) > 0) {
            throw ApiException.regraDeNegocio(
                    "A nota não pode exceder o valor máximo da avaliação (" + av.getValorMaximo() + ").");
        }
    }

    private Avaliacao avaliacao(Long id) {
        return avaliacoes.findComAtribuicaoById(id).orElseThrow(() -> ApiException.naoEncontrado("Avaliação", id));
    }

    private Nota obter(Long id) {
        return notas.findComAvaliacaoById(id).orElseThrow(() -> ApiException.naoEncontrado("Nota", id));
    }
}

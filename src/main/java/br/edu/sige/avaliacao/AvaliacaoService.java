package br.edu.sige.avaliacao;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.anoletivo.AnoLetivo;
import br.edu.sige.atribuicao.AtribuicaoDocente;
import br.edu.sige.atribuicao.AtribuicaoDocenteRepository;
import br.edu.sige.auditoria.AcaoAuditoria;
import br.edu.sige.auditoria.AuditoriaService;
import br.edu.sige.common.ApiException;
import br.edu.sige.nota.NotaRepository;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.UsuarioAutenticado;
import br.edu.sige.turma.Turma;
import br.edu.sige.turma.TurmaRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacoes;
    private final AtribuicaoDocenteRepository atribuicoes;
    private final TurmaRepository turmas;
    private final NotaRepository notas;
    private final AcessoService acesso;
    private final AuditoriaService auditoria;

    /** Informe {@code atribuicaoId} ou {@code turmaId}. PROFESSOR vê apenas avaliações das suas atribuições. */
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
    public Page<AvaliacaoResponse> listar(Long atribuicaoId, Long turmaId, Pageable pageable) {
        Page<Avaliacao> pagina;
        if (atribuicaoId != null) {
            acesso.exigirLeituraDaAtribuicao(atribuicao(atribuicaoId));
            pagina = avaliacoes.findByAtribuicaoId(atribuicaoId, pageable);
        } else if (turmaId != null) {
            Turma turma = turmas.findComEscolaById(turmaId)
                    .orElseThrow(() -> ApiException.naoEncontrado("Turma", turmaId));
            acesso.exigirLeituraDaTurma(turma);
            UsuarioAutenticado u = acesso.usuario();
            pagina = u.perfil() == PerfilNome.PROFESSOR
                    ? avaliacoes.findDaTurmaDoProfessor(turmaId, u.id(), pageable)
                    : avaliacoes.findByAtribuicaoTurmaId(turmaId, pageable);
        } else {
            throw ApiException.regraDeNegocio("Informe atribuicaoId ou turmaId.");
        }
        return pagina.map(AvaliacaoResponse::from);
    }

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
    public AvaliacaoResponse buscar(Long id) {
        Avaliacao av = obter(id);
        acesso.exigirLeituraDaAtribuicao(av.getAtribuicao());
        return AvaliacaoResponse.from(av);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    public AvaliacaoResponse criar(AvaliacaoRequest req) {
        AtribuicaoDocente atribuicao = atribuicao(req.atribuicaoId());
        acesso.exigirEscritaNaAtribuicao(atribuicao);
        exigirAtribuicaoAtiva(atribuicao);
        validarDataAnoLetivo(req.data(), atribuicao.getAnoLetivo());
        Avaliacao av = new Avaliacao();
        av.setAtribuicao(atribuicao);
        av.setNome(req.nome().trim());
        av.setData(req.data());
        av.setValorMaximo(req.valorMaximo());
        Avaliacao salva = avaliacoes.save(av);
        auditoria.registrar("AVALIACAO", salva.getId(), AcaoAuditoria.CRIACAO,
                "atribuicao=" + atribuicao.getId() + ", nome=" + salva.getNome() + ", max=" + salva.getValorMaximo());
        return AvaliacaoResponse.from(salva);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR')")
    public AvaliacaoResponse atualizar(Long id, AvaliacaoRequest req) {
        Avaliacao av = obter(id);
        AtribuicaoDocente atribuicao = av.getAtribuicao();
        acesso.exigirEscritaNaAtribuicao(atribuicao);
        exigirAtribuicaoAtiva(atribuicao);
        if (!atribuicao.getId().equals(req.atribuicaoId())) {
            throw ApiException.regraDeNegocio("Não é permitido mover a avaliação para outra atribuição.");
        }
        validarDataAnoLetivo(req.data(), atribuicao.getAnoLetivo());
        if (notas.existsByAvaliacaoIdAndValorGreaterThan(id, req.valorMaximo())) {
            throw ApiException.regraDeNegocio("Existem notas lançadas acima do novo valor máximo.");
        }
        String nomeAntes = av.getNome();
        var maxAntes = av.getValorMaximo();
        av.setNome(req.nome().trim());
        av.setData(req.data());
        av.setValorMaximo(req.valorMaximo());
        auditoria.registrar("AVALIACAO", id, AcaoAuditoria.ATUALIZACAO,
                "nome: " + nomeAntes + " -> " + av.getNome() + "; max: " + maxAntes + " -> " + av.getValorMaximo());
        return AvaliacaoResponse.from(av);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    public void excluir(Long id) {
        Avaliacao av = obter(id);
        AtribuicaoDocente atribuicao = av.getAtribuicao();
        acesso.exigirEscritaNaAtribuicao(atribuicao);
        exigirAtribuicaoAtiva(atribuicao);
        if (notas.existsByAvaliacaoId(id)) {
            throw ApiException.conflito("A avaliação possui notas lançadas; remova-as antes de excluir.");
        }
        auditoria.registrar("AVALIACAO", id, AcaoAuditoria.EXCLUSAO, "nome=" + av.getNome());
        avaliacoes.delete(av);
    }

    private void exigirAtribuicaoAtiva(AtribuicaoDocente atribuicao) {
        acesso.exigirAtribuicaoAtiva(atribuicao);
        if (!atribuicao.isAtivo()) {
            throw ApiException.regraDeNegocio("A atribuição docente está inativa.");
        }
    }

    private void validarDataAnoLetivo(LocalDate data, AnoLetivo ano) {
        if (ano != null && ano.getDataInicio() != null && ano.getDataFim() != null
                && (data.isBefore(ano.getDataInicio()) || data.isAfter(ano.getDataFim()))) {
            throw ApiException.regraDeNegocio(
                    "A data da avaliação deve estar dentro do período do ano letivo ("
                            + ano.getDataInicio() + " a " + ano.getDataFim() + ").");
        }
    }

    private AtribuicaoDocente atribuicao(Long id) {
        return atribuicoes.findComDetalhesById(id).orElseThrow(() -> ApiException.naoEncontrado("Atribuição", id));
    }

    private Avaliacao obter(Long id) {
        return avaliacoes.findComAtribuicaoById(id).orElseThrow(() -> ApiException.naoEncontrado("Avaliação", id));
    }
}

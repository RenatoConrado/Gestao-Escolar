package br.edu.sige.matricula;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.aluno.Aluno;
import br.edu.sige.aluno.AlunoRepository;
import br.edu.sige.aluno.AlunoResumoResponse;
import br.edu.sige.common.ApiException;
import br.edu.sige.turma.Turma;
import br.edu.sige.turma.TurmaRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatriculaService {

    private final MatriculaRepository matriculas;
    private final AlunoRepository alunos;
    private final TurmaRepository turmas;
    private final AcessoService acesso;

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','LEITOR')")
    public Page<MatriculaResponse> listar(Long turmaId, Pageable pageable) {
        Page<Matricula> pagina;
        if (turmaId != null) {
            acesso.exigirLeituraDaTurma(turma(turmaId));
            pagina = matriculas.findByTurmaId(turmaId, pageable);
        } else {
            Long escolaId = acesso.escolaRestrita();
            pagina = escolaId != null
                    ? matriculas.findByTurmaEscolaId(escolaId, pageable)
                    : matriculas.findAll(pageable);
        }
        return pagina.map(MatriculaResponse::from);
    }

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','LEITOR')")
    public MatriculaResponse buscar(Long id) {
        Matricula m = obter(id);
        acesso.exigirLeituraDaTurma(m.getTurma());
        return MatriculaResponse.from(m);
    }

    /** Lista de chamada: alunos com matrícula ATIVA na turma (todos os perfis, respeitando o escopo da turma). */
    public List<AlunoResumoResponse> alunosAtivosDaTurma(Long turmaId) {
        acesso.exigirLeituraDaTurma(turma(turmaId));
        return matriculas.findByTurmaIdAndSituacaoOrderByAlunoNomeAsc(turmaId, SituacaoMatricula.ATIVA).stream()
                .map(m -> AlunoResumoResponse.from(m.getAluno()))
                .toList();
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public MatriculaResponse criar(MatriculaRequest req) {
        Turma turma = turma(req.turmaId());
        acesso.exigirEscolaDoSecretario(turma.getEscola().getId());
        Aluno aluno = alunos.findById(req.alunoId())
                .orElseThrow(() -> ApiException.naoEncontrado("Aluno", req.alunoId()));
        SituacaoMatricula situacao = req.situacao() == null ? SituacaoMatricula.ATIVA : req.situacao();
        if (situacao == SituacaoMatricula.ATIVA && matriculas.existsByAlunoIdAndAnoLetivoIdAndSituacao(
                aluno.getId(), turma.getAnoLetivo().getId(), SituacaoMatricula.ATIVA)) {
            throw ApiException.conflito("O aluno já possui matrícula ativa neste ano letivo.");
        }
        Matricula m = new Matricula();
        m.setAluno(aluno);
        aplicar(m, turma, situacao, req.dataMatricula());
        return MatriculaResponse.from(matriculas.save(m));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public MatriculaResponse atualizar(Long id, MatriculaRequest req) {
        Matricula m = obter(id);
        acesso.exigirEscolaDoSecretario(m.getTurma().getEscola().getId());
        if (!m.getAluno().getId().equals(req.alunoId())) {
            throw ApiException.regraDeNegocio("Não é permitido trocar o aluno de uma matrícula.");
        }
        Turma turma = turma(req.turmaId());
        acesso.exigirEscolaDoSecretario(turma.getEscola().getId());
        SituacaoMatricula situacao = req.situacao() == null ? m.getSituacao() : req.situacao();
        if (situacao == SituacaoMatricula.ATIVA && matriculas.existsByAlunoIdAndAnoLetivoIdAndSituacaoAndIdNot(
                m.getAluno().getId(), turma.getAnoLetivo().getId(), SituacaoMatricula.ATIVA, id)) {
            throw ApiException.conflito("O aluno já possui outra matrícula ativa neste ano letivo.");
        }
        aplicar(m, turma, situacao, req.dataMatricula() == null ? m.getDataMatricula() : req.dataMatricula());
        return MatriculaResponse.from(m);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public void excluir(Long id) {
        Matricula m = obter(id);
        acesso.exigirEscolaDoSecretario(m.getTurma().getEscola().getId());
        matriculas.delete(m);
        matriculas.flush();
    }

    private void aplicar(Matricula m, Turma turma, SituacaoMatricula situacao, LocalDate data) {
        m.setTurma(turma);
        m.setAnoLetivo(turma.getAnoLetivo());
        m.setSituacao(situacao);
        m.setDataMatricula(data == null ? LocalDate.now() : data);
    }

    private Turma turma(Long id) {
        return turmas.findComEscolaById(id).orElseThrow(() -> ApiException.naoEncontrado("Turma", id));
    }

    private Matricula obter(Long id) {
        return matriculas.findComTurmaById(id).orElseThrow(() -> ApiException.naoEncontrado("Matrícula", id));
    }
}

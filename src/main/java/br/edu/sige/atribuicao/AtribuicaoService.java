package br.edu.sige.atribuicao;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.common.ApiException;
import br.edu.sige.disciplina.Disciplina;
import br.edu.sige.disciplina.DisciplinaRepository;
import br.edu.sige.professor.Professor;
import br.edu.sige.professor.ProfessorRepository;
import br.edu.sige.turma.Turma;
import br.edu.sige.turma.TurmaRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AtribuicaoService {

    private final AtribuicaoDocenteRepository atribuicoes;
    private final ProfessorRepository professores;
    private final TurmaRepository turmas;
    private final DisciplinaRepository disciplinas;
    private final AcessoService acesso;

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','LEITOR')")
    public Page<AtribuicaoResponse> listar(Long turmaId, Pageable pageable) {
        Page<AtribuicaoDocente> pagina;
        if (turmaId != null) {
            acesso.exigirLeituraDaTurma(turma(turmaId));
            pagina = atribuicoes.findByTurmaId(turmaId, pageable);
        } else {
            Long escolaId = acesso.escolaRestrita();
            pagina = escolaId != null
                    ? atribuicoes.findByTurmaEscolaId(escolaId, pageable)
                    : atribuicoes.findAll(pageable);
        }
        return pagina.map(AtribuicaoResponse::from);
    }

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','LEITOR')")
    public AtribuicaoResponse buscar(Long id) {
        AtribuicaoDocente a = obter(id);
        acesso.exigirLeituraDaTurma(a.getTurma());
        return AtribuicaoResponse.from(a);
    }

    /** Atribuições ativas do professor autenticado (base das telas de diário de classe). */
    @PreAuthorize("hasRole('PROFESSOR')")
    public List<AtribuicaoResponse> minhas() {
        return atribuicoes.findByProfessorUsuarioIdAndAtivoTrue(acesso.usuario().id()).stream()
                .map(AtribuicaoResponse::from)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public AtribuicaoResponse criar(AtribuicaoRequest req) {
        Turma turma = turma(req.turmaId());
        Professor professor = validarEscopo(req, turma);
        if (atribuicoes.existsByProfessorIdAndTurmaIdAndDisciplinaId(
                req.professorId(), req.turmaId(), req.disciplinaId())) {
            throw ApiException.conflito("Esta atribuição docente já existe.");
        }
        AtribuicaoDocente a = new AtribuicaoDocente();
        aplicar(a, req, professor, turma);
        return AtribuicaoResponse.from(atribuicoes.save(a));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public AtribuicaoResponse atualizar(Long id, AtribuicaoRequest req) {
        AtribuicaoDocente a = obter(id);
        acesso.exigirEscolaDoSecretario(a.getTurma().getEscola().getId());
        Turma turma = turma(req.turmaId());
        Professor professor = validarEscopo(req, turma);
        if (atribuicoes.existsByProfessorIdAndTurmaIdAndDisciplinaIdAndIdNot(
                req.professorId(), req.turmaId(), req.disciplinaId(), id)) {
            throw ApiException.conflito("Esta atribuição docente já existe.");
        }
        aplicar(a, req, professor, turma);
        return AtribuicaoResponse.from(a);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public void excluir(Long id) {
        AtribuicaoDocente a = obter(id);
        acesso.exigirEscolaDoSecretario(a.getTurma().getEscola().getId());
        atribuicoes.delete(a);
        atribuicoes.flush();
    }

    /** Escola do SECRETARIO e coerência professor x turma (o professor deve ser lotado na escola da turma). */
    private Professor validarEscopo(AtribuicaoRequest req, Turma turma) {
        acesso.exigirEscolaDoSecretario(turma.getEscola().getId());
        Professor professor = professores.findComEscolaById(req.professorId())
                .orElseThrow(() -> ApiException.naoEncontrado("Professor", req.professorId()));
        if (!professor.getEscola().getId().equals(turma.getEscola().getId())) {
            throw ApiException.regraDeNegocio("O professor deve estar lotado na mesma escola da turma.");
        }
        return professor;
    }

    private void aplicar(AtribuicaoDocente a, AtribuicaoRequest req, Professor professor, Turma turma) {
        Disciplina disciplina = disciplinas.findById(req.disciplinaId())
                .orElseThrow(() -> ApiException.naoEncontrado("Disciplina", req.disciplinaId()));
        a.setProfessor(professor);
        a.setTurma(turma);
        a.setDisciplina(disciplina);
        a.setAnoLetivo(turma.getAnoLetivo());
        a.setAtivo(req.ativo() == null || req.ativo());
    }

    private Turma turma(Long id) {
        return turmas.findComEscolaById(id).orElseThrow(() -> ApiException.naoEncontrado("Turma", id));
    }

    private AtribuicaoDocente obter(Long id) {
        return atribuicoes.findComDetalhesById(id).orElseThrow(() -> ApiException.naoEncontrado("Atribuição", id));
    }
}

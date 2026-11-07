package br.edu.sige.atribuicao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AtribuicaoDocenteRepository extends JpaRepository<AtribuicaoDocente, Long> {

    @EntityGraph(attributePaths = {"professor", "turma", "turma.escola", "disciplina", "anoLetivo"})
    Page<AtribuicaoDocente> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"professor", "turma", "turma.escola", "disciplina", "anoLetivo"})
    Page<AtribuicaoDocente> findByTurmaId(Long turmaId, Pageable pageable);

    @EntityGraph(attributePaths = {"professor", "turma", "turma.escola", "disciplina", "anoLetivo"})
    Page<AtribuicaoDocente> findByTurmaEscolaId(Long escolaId, Pageable pageable);

    @EntityGraph(attributePaths = {"professor", "turma", "turma.escola", "disciplina", "anoLetivo"})
    Optional<AtribuicaoDocente> findComDetalhesById(Long id);

    @EntityGraph(attributePaths = {"professor", "turma", "turma.escola", "disciplina", "anoLetivo"})
    List<AtribuicaoDocente> findByProfessorUsuarioIdAndAtivoTrue(Long usuarioId);

    @EntityGraph(attributePaths = {"turma", "disciplina", "anoLetivo"})
    List<AtribuicaoDocente> findByTurmaIdAndAnoLetivoIdAndAtivoTrue(Long turmaId, Long anoLetivoId);

    boolean existsByProfessorUsuarioIdAndTurmaIdAndAtivoTrue(Long usuarioId, Long turmaId);

    boolean existsByIdAndProfessorUsuarioIdAndAtivoTrue(Long id, Long usuarioId);

    boolean existsByProfessorIdAndTurmaIdAndDisciplinaId(Long professorId, Long turmaId, Long disciplinaId);

    boolean existsByProfessorIdAndTurmaIdAndDisciplinaIdAndIdNot(Long professorId, Long turmaId,
                                                                 Long disciplinaId, Long id);
}

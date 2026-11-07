package br.edu.sige.turma;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TurmaRepository extends JpaRepository<Turma, Long> {

    @EntityGraph(attributePaths = {"escola", "anoLetivo"})
    Page<Turma> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"escola", "anoLetivo"})
    Page<Turma> findByEscolaId(Long escolaId, Pageable pageable);

    @EntityGraph(attributePaths = {"escola", "anoLetivo"})
    Optional<Turma> findComEscolaById(Long id);

    /** Turmas em que o professor (identificado pelo usuário) tem atribuição docente ativa. */
    @EntityGraph(attributePaths = {"escola", "anoLetivo"})
    @Query("""
            select t from Turma t
            where exists (select 1 from AtribuicaoDocente a
                          where a.turma = t and a.ativo = true and a.professor.usuario.id = :usuarioId)
            """)
    Page<Turma> findDoProfessor(@Param("usuarioId") Long usuarioId, Pageable pageable);

    long countByEscolaId(Long escolaId);
}

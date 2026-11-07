package br.edu.sige.frequencia;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FrequenciaRepository extends JpaRepository<Frequencia, Long> {

    @EntityGraph(attributePaths = "aluno")
    Page<Frequencia> findByTurmaId(Long turmaId, Pageable pageable);

    @EntityGraph(attributePaths = "aluno")
    Page<Frequencia> findByTurmaIdAndData(Long turmaId, LocalDate data, Pageable pageable);

    @EntityGraph(attributePaths = "aluno")
    List<Frequencia> findAllByTurmaIdAndData(Long turmaId, LocalDate data);

    @EntityGraph(attributePaths = {"aluno", "turma", "turma.escola"})
    Optional<Frequencia> findComTurmaById(Long id);

    boolean existsByAlunoIdAndTurmaIdAndData(Long alunoId, Long turmaId, LocalDate data);

    @Query("""
            select a.id as alunoId, a.nome as alunoNome, a.matricula as alunoMatricula, count(f) as total,
                   sum(case when f.presente = true then 1L else 0L end) as presencas
            from Frequencia f join f.aluno a
            where f.turma.id = :turmaId
            group by a.id, a.nome, a.matricula
            order by a.nome
            """)
    List<ResumoFrequenciaAluno> resumirPorTurma(@Param("turmaId") Long turmaId);

    @Query("""
            select a.id as alunoId, a.nome as alunoNome, a.matricula as alunoMatricula, count(f) as total,
                   sum(case when f.presente = true then 1L else 0L end) as presencas
            from Frequencia f join f.aluno a
            where f.turma.id = :turmaId and f.aluno.id = :alunoId
            group by a.id, a.nome, a.matricula
            """)
    Optional<ResumoFrequenciaAluno> resumirPorAlunoETurma(@Param("alunoId") Long alunoId,
                                                           @Param("turmaId") Long turmaId);
}

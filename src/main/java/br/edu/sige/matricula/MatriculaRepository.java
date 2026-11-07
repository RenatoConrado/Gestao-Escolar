package br.edu.sige.matricula;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {

    @EntityGraph(attributePaths = {"aluno", "turma"})
    Page<Matricula> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"aluno", "turma"})
    Page<Matricula> findByTurmaId(Long turmaId, Pageable pageable);

    @EntityGraph(attributePaths = {"aluno", "turma"})
    Page<Matricula> findByTurmaEscolaId(Long escolaId, Pageable pageable);

    @EntityGraph(attributePaths = {"aluno", "turma", "turma.escola"})
    Optional<Matricula> findComTurmaById(Long id);

    @EntityGraph(attributePaths = {"aluno", "turma", "turma.escola", "anoLetivo"})
    List<Matricula> findByAlunoIdAndSituacao(Long alunoId, SituacaoMatricula situacao);

    @EntityGraph(attributePaths = "aluno")
    List<Matricula> findByTurmaIdAndSituacaoOrderByAlunoNomeAsc(Long turmaId, SituacaoMatricula situacao);

    @Query("select m.aluno.id from Matricula m where m.turma.id = :turmaId and m.situacao = :situacao")
    List<Long> findAlunoIdsByTurmaAndSituacao(@Param("turmaId") Long turmaId,
                                              @Param("situacao") SituacaoMatricula situacao);

    boolean existsByAlunoIdAndTurmaIdAndSituacao(Long alunoId, Long turmaId, SituacaoMatricula situacao);

    boolean existsByAlunoIdAndAnoLetivoIdAndSituacao(Long alunoId, Long anoLetivoId, SituacaoMatricula situacao);

    boolean existsByAlunoIdAndAnoLetivoIdAndSituacaoAndIdNot(Long alunoId, Long anoLetivoId,
                                                             SituacaoMatricula situacao, Long id);

    long countBySituacao(SituacaoMatricula situacao);

    long countByTurmaEscolaIdAndSituacao(Long escolaId, SituacaoMatricula situacao);

    /** Alunos distintos com matrícula ativa nas turmas em que o professor tem atribuição ativa. */
    @Query("""
            select count(distinct m.aluno.id) from Matricula m
            where m.situacao = :situacao
              and m.turma.id in (select a.turma.id from AtribuicaoDocente a
                                 where a.professor.usuario.id = :usuarioId and a.ativo = true)
            """)
    long contarAlunosDoProfessor(@Param("usuarioId") Long usuarioId, @Param("situacao") SituacaoMatricula situacao);
}

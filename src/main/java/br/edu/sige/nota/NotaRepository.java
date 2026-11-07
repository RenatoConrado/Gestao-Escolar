package br.edu.sige.nota;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotaRepository extends JpaRepository<Nota, Long> {

    @EntityGraph(attributePaths = {"aluno", "avaliacao", "avaliacao.atribuicao", "avaliacao.atribuicao.turma",
            "avaliacao.atribuicao.turma.escola"})
    Optional<Nota> findComAvaliacaoById(Long id);

    @EntityGraph(attributePaths = {"aluno", "avaliacao"})
    Page<Nota> findByAvaliacaoId(Long avaliacaoId, Pageable pageable);

    @EntityGraph(attributePaths = {"avaliacao", "avaliacao.atribuicao", "avaliacao.atribuicao.disciplina"})
    List<Nota> findByAlunoIdAndAvaliacaoAtribuicaoIdIn(Long alunoId, List<Long> atribuicaoIds);

    @EntityGraph(attributePaths = {"aluno", "avaliacao"})
    @Query("select n from Nota n where n.avaliacao.atribuicao.turma.id = :turmaId")
    Page<Nota> findPorTurma(@Param("turmaId") Long turmaId, Pageable pageable);

    /** Notas da turma restritas às avaliações das atribuições ativas do professor. */
    @EntityGraph(attributePaths = {"aluno", "avaliacao"})
    @Query("""
            select n from Nota n
            where n.avaliacao.atribuicao.turma.id = :turmaId
              and n.avaliacao.atribuicao.professor.usuario.id = :usuarioId
              and n.avaliacao.atribuicao.ativo = true
            """)
    Page<Nota> findPorTurmaDoProfessor(@Param("turmaId") Long turmaId, @Param("usuarioId") Long usuarioId,
                                       Pageable pageable);

    boolean existsByAlunoIdAndAvaliacaoId(Long alunoId, Long avaliacaoId);

    boolean existsByAvaliacaoId(Long avaliacaoId);

    boolean existsByAvaliacaoIdAndValorGreaterThan(Long avaliacaoId, BigDecimal valor);
}

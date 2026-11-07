package br.edu.sige.avaliacao;

import java.util.Optional;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    @EntityGraph(attributePaths = {"atribuicao", "atribuicao.turma", "atribuicao.turma.escola"})
    Optional<Avaliacao> findComAtribuicaoById(Long id);

    @EntityGraph(attributePaths = "atribuicao")
    Page<Avaliacao> findByAtribuicaoId(Long atribuicaoId, Pageable pageable);

    @EntityGraph(attributePaths = "atribuicao")
    Page<Avaliacao> findByAtribuicaoTurmaId(Long turmaId, Pageable pageable);

    @EntityGraph(attributePaths = {"atribuicao", "atribuicao.disciplina"})
    List<Avaliacao> findByAtribuicaoIdInOrderByDataAsc(List<Long> atribuicaoIds);

    /** Avaliações da turma restritas às atribuições ativas do professor. */
    @EntityGraph(attributePaths = "atribuicao")
    @Query("""
            select av from Avaliacao av
            where av.atribuicao.turma.id = :turmaId
              and av.atribuicao.professor.usuario.id = :usuarioId
              and av.atribuicao.ativo = true
            """)
    Page<Avaliacao> findDaTurmaDoProfessor(@Param("turmaId") Long turmaId, @Param("usuarioId") Long usuarioId,
                                           Pageable pageable);
}

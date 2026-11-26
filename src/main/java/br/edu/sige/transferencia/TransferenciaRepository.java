package br.edu.sige.transferencia;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransferenciaRepository extends JpaRepository<TransferenciaAluno, Long> {

    boolean existsByMatriculaOrigemIdAndSituacao(Long matriculaId, TransferenciaSituacao situacao);

    @Query("""
            select t from TransferenciaAluno t
            where (:admin = true or t.escolaDestino.id = :escolaId
                   or t.matriculaOrigem.turma.escola.id = :escolaId)
            """)
    Page<TransferenciaAluno> listarEscopo(@Param("admin") boolean admin,
                                          @Param("escolaId") Long escolaId,
                                          Pageable pageable);
}

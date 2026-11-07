package br.edu.sige.auditoria;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventoAuditoriaRepository extends JpaRepository<EventoAuditoria, Long> {

    Page<EventoAuditoria> findByEntidade(String entidade, Pageable pageable);

    Page<EventoAuditoria> findByEntidadeAndEntidadeId(String entidade, Long entidadeId, Pageable pageable);
}

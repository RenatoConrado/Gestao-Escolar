package br.edu.sige.auditoria;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EventoAuditoriaRepositoryCustom {

    Page<EventoAuditoria> filtrar(String entidade, Long entidadeId, String perfil,
                                  Instant inicio, Instant fimExclusivo, Pageable pageable);
}

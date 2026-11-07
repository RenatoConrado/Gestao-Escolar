package br.edu.sige.auditoria;

import java.time.Instant;

public record EventoAuditoriaResponse(Long id, Instant em, Long usuarioId, String perfil, String entidade,
                                      Long entidadeId, AcaoAuditoria acao, String detalhes) {

    public static EventoAuditoriaResponse from(EventoAuditoria e) {
        return new EventoAuditoriaResponse(e.getId(), e.getEm(), e.getUsuarioId(), e.getPerfil(), e.getEntidade(),
                e.getEntidadeId(), e.getAcao(), e.getDetalhes());
    }
}

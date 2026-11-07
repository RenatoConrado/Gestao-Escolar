package br.edu.sige.auditoria;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.common.ApiException;
import br.edu.sige.security.ContextoSeguranca;
import br.edu.sige.security.UsuarioAutenticado;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private static final int MAX_DETALHES = 500;

    private final EventoAuditoriaRepository eventos;
    private final ContextoSeguranca contexto;

    /**
     * Exige transação já aberta (MANDATORY): o evento é confirmado ou desfeito junto com a alteração auditada,
     * então nunca existe alteração sem registro nem registro de alteração que não aconteceu.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(String entidade, Long entidadeId, AcaoAuditoria acao, String detalhes) {
        UsuarioAutenticado u = contexto.atual();
        eventos.save(new EventoAuditoria(Instant.now(), u.id(), u.perfil().name(), entidade, entidadeId, acao,
                truncar(detalhes)));
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public Page<EventoAuditoriaResponse> consultar(String entidade, Long entidadeId, Pageable pageable) {
        Page<EventoAuditoria> pagina;
        if (entidade != null && entidadeId != null) {
            pagina = eventos.findByEntidadeAndEntidadeId(entidade.toUpperCase(), entidadeId, pageable);
        } else if (entidade != null) {
            pagina = eventos.findByEntidade(entidade.toUpperCase(), pageable);
        } else if (entidadeId != null) {
            throw ApiException.regraDeNegocio("Para filtrar por entidadeId informe também a entidade.");
        } else {
            pagina = eventos.findAll(pageable);
        }
        return pagina.map(EventoAuditoriaResponse::from);
    }

    private String truncar(String texto) {
        if (texto == null || texto.length() <= MAX_DETALHES) {
            return texto;
        }
        return texto.substring(0, MAX_DETALHES - 3) + "...";
    }
}

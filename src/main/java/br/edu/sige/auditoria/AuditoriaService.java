package br.edu.sige.auditoria;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.common.ApiException;
import br.edu.sige.security.ContextoSeguranca;
import br.edu.sige.security.UsuarioAutenticado;
import br.edu.sige.usuario.Usuario;
import br.edu.sige.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private static final int MAX_DETALHES = 500;

    private final EventoAuditoriaRepository eventos;
    private final ContextoSeguranca contexto;
    private final UsuarioRepository usuarios;

    /**
     * Exige transação já aberta (MANDATORY): o evento é confirmado ou desfeito junto com a alteração auditada,
     * então nunca existe alteração sem registro nem registro de alteração que não aconteceu.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(String entidade, Long entidadeId, AcaoAuditoria acao, String detalhes) {
        UsuarioAutenticado u = contexto.atual();
        String nome = usuarios.findComPerfilById(u.id()).map(Usuario::getNome).orElse(null);
        eventos.save(new EventoAuditoria(Instant.now(), u.id(), nome, u.perfil().name(), entidade, entidadeId,
                acao, truncar(detalhes)));
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public Page<EventoAuditoriaResponse> consultar(String entidade, Long entidadeId, String perfil,
                                                    LocalDate de, LocalDate ate, Pageable pageable) {
        if (de != null && ate != null && de.isAfter(ate)) {
            throw ApiException.regraDeNegocio("A data inicial não pode ser posterior à data final.");
        }
        if (entidadeId != null && (entidade == null || entidade.isBlank())) {
            throw ApiException.regraDeNegocio("Para filtrar por entidadeId informe também a entidade.");
        }
        ZoneId zona = ZoneId.of("America/Sao_Paulo");
        Instant inicio = de == null ? null : de.atStartOfDay(zona).toInstant();
        Instant fimExclusivo = ate == null ? null : ate.plusDays(1).atStartOfDay(zona).toInstant();
        Page<EventoAuditoria> pagina = eventos.filtrar(
                entidade == null || entidade.isBlank() ? null : entidade.toUpperCase(),
                entidadeId, perfil == null || perfil.isBlank() ? null : perfil.toUpperCase(),
                inicio, fimExclusivo, pageable);
        return pagina.map(EventoAuditoriaResponse::from);
    }

    private String truncar(String texto) {
        if (texto == null || texto.length() <= MAX_DETALHES) {
            return texto;
        }
        return texto.substring(0, MAX_DETALHES - 3) + "...";
    }
}

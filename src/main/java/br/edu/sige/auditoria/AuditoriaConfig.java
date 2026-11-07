package br.edu.sige.auditoria;

import java.util.Optional;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/** Preenche criado_por/atualizado_por com o id do usuário autenticado (vazio em operações sem login, ex.: bootstrap). */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "usuarioAuditor")
public class AuditoriaConfig {

    @Component("usuarioAuditor")
    static class UsuarioAuditor implements AuditorAware<Long> {

        @Override
        public Optional<Long> getCurrentAuditor() {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth instanceof JwtAuthenticationToken jwt) {
                try {
                    return Optional.of(Long.valueOf(jwt.getToken().getSubject()));
                } catch (NumberFormatException e) {
                    return Optional.empty();
                }
            }
            return Optional.empty();
        }
    }
}

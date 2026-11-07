package br.edu.sige.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import br.edu.sige.common.ApiException;

/** Acesso tipado ao usuário autenticado da requisição corrente. */
@Component
public class ContextoSeguranca {

    public UsuarioAutenticado atual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken jwtAuth)) {
            throw ApiException.naoAutenticado("Usuário não autenticado.");
        }
        Jwt jwt = jwtAuth.getToken();
        Number escola = jwt.getClaim("escolaId");
        return new UsuarioAutenticado(
                Long.valueOf(jwt.getSubject()),
                jwt.getClaimAsString("email"),
                PerfilNome.valueOf(jwt.getClaimAsString("perfil")),
                escola == null ? null : escola.longValue());
    }
}

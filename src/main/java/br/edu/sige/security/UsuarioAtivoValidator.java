package br.edu.sige.security;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import br.edu.sige.usuario.UsuarioRepository;
import br.edu.sige.usuario.UsuarioStatusToken;
import lombok.RequiredArgsConstructor;

/**
 * Revogação de tokens: rejeita o JWT se o usuário foi excluído, desativado ou se a "versão do token" mudou
 * (troca de senha, perfil ou escola). Custa uma consulta por chave primária por requisição - desprezível
 * para o porte do sistema e sem janela de inconsistência (não há cache).
 */
@Component
@RequiredArgsConstructor
public class UsuarioAtivoValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error ERRO =
            new OAuth2Error("invalid_token", "Sessão revogada ou usuário desativado.", null);

    private final UsuarioRepository usuarios;

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        Long id;
        try {
            id = Long.valueOf(jwt.getSubject());
        } catch (NumberFormatException e) {
            return OAuth2TokenValidatorResult.failure(ERRO);
        }
        Number versaoNoToken = jwt.getClaim("ver");
        UsuarioStatusToken status = usuarios.findStatusById(id).orElse(null);
        if (status == null || versaoNoToken == null
                || !Boolean.TRUE.equals(status.getAtivo())
                || status.getVersaoToken() == null
                || status.getVersaoToken() != versaoNoToken.intValue()) {
            return OAuth2TokenValidatorResult.failure(ERRO);
        }
        return OAuth2TokenValidatorResult.success();
    }
}

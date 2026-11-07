package br.edu.sige.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import br.edu.sige.usuario.UsuarioRepository;
import br.edu.sige.usuario.UsuarioStatusToken;

class UsuarioAtivoValidatorTest {

    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final UsuarioAtivoValidator validator = new UsuarioAtivoValidator(usuarios);

    private Jwt token(String subject, Integer versao) {
        Jwt.Builder b = Jwt.withTokenValue("t").header("alg", "HS256").subject(subject)
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60));
        if (versao != null) {
            b.claim("ver", versao);
        }
        return b.build();
    }

    private void usuarioNoBanco(boolean ativo, int versao) {
        UsuarioStatusToken status = mock(UsuarioStatusToken.class);
        when(status.getAtivo()).thenReturn(ativo);
        when(status.getVersaoToken()).thenReturn(versao);
        when(usuarios.findStatusById(7L)).thenReturn(Optional.of(status));
    }

    @Test
    void aceitaUsuarioAtivoComMesmaVersao() {
        usuarioNoBanco(true, 2);

        assertThat(validator.validate(token("7", 2)).hasErrors()).isFalse();
    }

    @Test
    void rejeitaUsuarioDesativado() {
        usuarioNoBanco(false, 2);

        assertThat(validator.validate(token("7", 2)).hasErrors()).isTrue();
    }

    @Test
    void rejeitaTokenComVersaoAntiga() {
        usuarioNoBanco(true, 3);   // senha/perfil mudou depois da emissão do token

        assertThat(validator.validate(token("7", 2)).hasErrors()).isTrue();
    }

    @Test
    void rejeitaUsuarioInexistenteOuTokenSemVersao() {
        when(usuarios.findStatusById(7L)).thenReturn(Optional.empty());
        assertThat(validator.validate(token("7", 0)).hasErrors()).isTrue();

        usuarioNoBanco(true, 0);
        assertThat(validator.validate(token("7", null)).hasErrors()).isTrue();
        assertThat(validator.validate(token("abc", 0)).hasErrors()).isTrue();
    }
}

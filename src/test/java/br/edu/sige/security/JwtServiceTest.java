package br.edu.sige.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

import br.edu.sige.escola.Escola;
import br.edu.sige.usuario.Perfil;
import br.edu.sige.usuario.Usuario;

class JwtServiceTest {

    private static final String SEGREDO = "segredo-de-teste-com-mais-de-32-caracteres-ok";

    @Test
    void tokenEmitidoCarregaAuthoritiesEClaimsEPassaNaValidacao() {
        SecretKey chave = new SecretKeySpec(SEGREDO.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(chave));
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(chave).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(JwtService.ISSUER));
        JwtDecoder jwtDecoder = decoder;
        JwtService service = new JwtService(encoder, new JwtProperties(SEGREDO, Duration.ofHours(1)));

        Perfil perfil = new Perfil();
        perfil.setId(2L);
        perfil.setNome("SECRETARIO");
        Escola escola = new Escola();
        ReflectionTestUtils.setField(escola, "id", 5L);
        Usuario usuario = new Usuario();
        ReflectionTestUtils.setField(usuario, "id", 7L);
        usuario.setEmail("secretaria@sige.local");
        usuario.setPerfil(perfil);
        usuario.setEscola(escola);

        TokenEmitido token = service.emitir(usuario);
        Jwt jwt = jwtDecoder.decode(token.valor());

        assertThat(jwt.getSubject()).isEqualTo("7");
        assertThat(jwt.getClaimAsStringList("authorities")).containsExactly("ROLE_SECRETARIO");
        assertThat(jwt.getClaimAsString("perfil")).isEqualTo("SECRETARIO");
        assertThat(((Number) jwt.getClaim("ver")).intValue()).isZero();
        assertThat(jwt.getClaimAsString("email")).isEqualTo("secretaria@sige.local");
        assertThat(((Number) jwt.getClaim("escolaId")).longValue()).isEqualTo(5L);
        assertThat(token.expiraEm()).isAfter(jwt.getIssuedAt());
    }
}

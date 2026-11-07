package br.edu.sige.security;

import java.time.Instant;
import java.util.List;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import br.edu.sige.usuario.Usuario;
import lombok.RequiredArgsConstructor;

/** Emissão de JWT (HS256). O payload carrega as authorities, ex.: ROLE_PROFESSOR. */
@Service
@RequiredArgsConstructor
public class JwtService {

    public static final String ISSUER = "sige-api";

    private final JwtEncoder encoder;
    private final JwtProperties props;

    public TokenEmitido emitir(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expira = agora.plus(props.expiracao());
        String perfil = usuario.getPerfil().getNome();

        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .issuedAt(agora)
                .expiresAt(expira)
                .subject(String.valueOf(usuario.getId()))
                .claim("email", usuario.getEmail())
                .claim("perfil", perfil)
                .claim("ver", usuario.getVersaoToken())
                .claim("authorities", List.of("ROLE_" + perfil));
        if (usuario.getEscola() != null) {
            claims.claim("escolaId", usuario.getEscola().getId());
        }

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims.build())).getTokenValue();
        return new TokenEmitido(token, expira);
    }
}

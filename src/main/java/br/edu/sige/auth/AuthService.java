package br.edu.sige.auth;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.auditoria.AcaoAuditoria;
import br.edu.sige.auditoria.AuditoriaService;
import br.edu.sige.common.ApiException;
import br.edu.sige.security.ContextoSeguranca;
import br.edu.sige.security.JwtService;
import br.edu.sige.security.SenhaPolitica;
import br.edu.sige.security.TokenEmitido;
import br.edu.sige.usuario.Usuario;
import br.edu.sige.usuario.UsuarioRepository;
import br.edu.sige.usuario.UsuarioResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(readOnly = true)
public class AuthService {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final ContextoSeguranca contexto;
    private final LoginRateLimiter limiter;
    private final AuditoriaService auditoria;
    /** Gasta o mesmo tempo de BCrypt quando o e-mail não existe (evita enumeração de contas por tempo de resposta). */
    private final String hashFicticio;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder encoder, JwtService jwtService,
                       ContextoSeguranca contexto, LoginRateLimiter limiter, AuditoriaService auditoria) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.contexto = contexto;
        this.limiter = limiter;
        this.auditoria = auditoria;
        this.hashFicticio = encoder.encode("hash-ficticio-para-equalizar-tempo");
    }

    /**
     * Fluxo: (1) campos obrigatórios (Bean Validation, 400) -> (2) limite de tentativas (429) -> (3) credenciais (401)
     * -> (4) usuário ativo (403) -> (5) emissão do JWT. "Ativo" é verificado depois da senha para não revelar o
     * estado de contas a quem não conhece a credencial.
     */
    public LoginResponse login(LoginRequest req, String origem) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        limiter.verificar(origem, email);

        Usuario usuario = usuarios.findByEmail(email).orElse(null);
        if (usuario == null) {
            encoder.matches(req.senha(), hashFicticio);
            throw falhaDeCredenciais(origem, email);
        }
        if (SenhaPolitica.excedeLimite(req.senha()) || !encoder.matches(req.senha(), usuario.getSenhaHash())) {
            throw falhaDeCredenciais(origem, email);
        }
        if (!usuario.isAtivo()) {
            throw ApiException.proibido("Usuário desativado. Procure a administração do sistema.");
        }

        limiter.registrarSucesso(origem, email);
        return resposta(usuario);
    }

    public UsuarioResponse me() {
        Long id = contexto.atual().id();
        return usuarios.findComPerfilById(id)
                .map(UsuarioResponse::from)
                .orElseThrow(() -> ApiException.naoAutenticado("Usuário não encontrado."));
    }

    /**
     * Troca da própria senha. Revoga TODOS os tokens anteriores (inclusive de outros dispositivos) e devolve um
     * token novo para a sessão atual continuar. Tentativas erradas da senha atual entram no limitador.
     */
    @Transactional
    public LoginResponse alterarSenha(AlterarSenhaRequest req, String origem) {
        Long id = contexto.atual().id();
        String conta = "senha:" + id;
        limiter.verificar(origem, conta);

        Usuario usuario = usuarios.findComPerfilById(id)
                .orElseThrow(() -> ApiException.naoAutenticado("Usuário não encontrado."));
        if (SenhaPolitica.excedeLimite(req.senhaAtual()) || !encoder.matches(req.senhaAtual(), usuario.getSenhaHash())) {
            limiter.registrarFalha(origem, conta);
            throw ApiException.regraDeNegocio("Senha atual incorreta.");
        }
        SenhaPolitica.validar(req.novaSenha());
        if (encoder.matches(req.novaSenha(), usuario.getSenhaHash())) {
            throw ApiException.regraDeNegocio("A nova senha deve ser diferente da atual.");
        }

        usuario.setSenhaHash(encoder.encode(req.novaSenha()));
        usuario.revogarTokens();
        limiter.registrarSucesso(origem, conta);
        auditoria.registrar("USUARIO", id, AcaoAuditoria.ATUALIZACAO, "senha alterada pelo próprio usuário");
        return resposta(usuario);
    }

    private LoginResponse resposta(Usuario usuario) {
        TokenEmitido token = jwtService.emitir(usuario);
        return new LoginResponse(token.valor(), "Bearer", token.expiraEm(), UsuarioResponse.from(usuario));
    }

    private ApiException falhaDeCredenciais(String origem, String email) {
        limiter.registrarFalha(origem, email);
        log.warn("Falha de login: origem={} email={}", origem, email.replaceAll("[\\r\\n]", "_"));
        return ApiException.naoAutenticado("E-mail ou senha inválidos.");
    }
}

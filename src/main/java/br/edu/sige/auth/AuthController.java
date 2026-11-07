package br.edu.sige.auth;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.edu.sige.usuario.UsuarioResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Autenticação")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    /** Público (liberado no SecurityConfig). 400 campos ausentes, 401 credenciais, 403 desativado, 429 excesso de tentativas. */
    @PostMapping("/login")
    @SecurityRequirements
    public LoginResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        return service.login(req, http.getRemoteAddr());
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
    public UsuarioResponse me() {
        return service.me();
    }

    /** Troca a própria senha, revoga os tokens antigos e devolve um token novo. */
    @PutMapping("/alterar-senha")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
    public LoginResponse alterarSenha(@Valid @RequestBody AlterarSenhaRequest req, HttpServletRequest http) {
        return service.alterarSenha(req, http.getRemoteAddr());
    }
}

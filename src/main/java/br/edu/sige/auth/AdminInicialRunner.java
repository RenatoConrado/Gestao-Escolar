package br.edu.sige.auth;

import java.util.Locale;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import br.edu.sige.security.PerfilNome;
import br.edu.sige.usuario.PerfilRepository;
import br.edu.sige.usuario.Usuario;
import br.edu.sige.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Cria o primeiro ADMIN a partir de variáveis de ambiente (ADMIN_EMAIL / ADMIN_SENHA), somente se a tabela
 * de usuários estiver vazia. Evita senha padrão embutida em migração ou código.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInicialRunner implements ApplicationRunner {

    private final BootstrapProperties props;
    private final UsuarioRepository usuarios;
    private final PerfilRepository perfis;
    private final PasswordEncoder encoder;

    @Override
    public void run(ApplicationArguments args) {
        if (isBlank(props.adminEmail()) || isBlank(props.adminSenha()) || usuarios.count() > 0) {
            return;
        }
        Usuario admin = new Usuario();
        admin.setNome(isBlank(props.adminNome()) ? "Administrador" : props.adminNome());
        admin.setEmail(props.adminEmail().trim().toLowerCase(Locale.ROOT));
        admin.setSenhaHash(encoder.encode(props.adminSenha()));
        admin.setPerfil(perfis.findByNome(PerfilNome.ADMIN.name()).orElseThrow());
        admin.setAtivo(true);
        usuarios.save(admin);
        log.info("Usuário ADMIN inicial criado ({}). Remova ADMIN_SENHA do ambiente após o primeiro acesso.", admin.getEmail());
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}

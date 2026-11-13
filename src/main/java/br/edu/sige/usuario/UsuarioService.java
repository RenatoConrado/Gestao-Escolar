package br.edu.sige.usuario;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.auditoria.AcaoAuditoria;
import br.edu.sige.auditoria.AuditoriaService;
import br.edu.sige.common.ApiException;
import br.edu.sige.escola.Escola;
import br.edu.sige.escola.EscolaRepository;
import br.edu.sige.security.ContextoSeguranca;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.SenhaPolitica;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UsuarioService {

    private final UsuarioRepository usuarios;
    private final PerfilRepository perfis;
    private final EscolaRepository escolas;
    private final PasswordEncoder encoder;
    private final ContextoSeguranca contexto;
    private final AcessoService acesso;
    private final AuditoriaService auditoria;

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public Page<UsuarioResponse> listar(Pageable pageable) {
        Long escolaId = acesso.escolaRestrita();
        Page<Usuario> pagina = escolaId != null
                ? usuarios.findByEscolaId(escolaId, pageable)
                : usuarios.findAll(pageable);
        return pagina.map(UsuarioResponse::from);
    }

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public UsuarioResponse buscar(Long id) {
        Usuario u = obter(id);
        Long escolaId = acesso.escolaRestrita();
        if (escolaId != null && !escolaId.equals(idEscola(u))) {
            throw ApiException.proibido("Acesso negado: usuário de outra unidade escolar.");
        }
        return UsuarioResponse.from(u);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse criar(UsuarioRequest req) {
        String email = normalizar(req.email());
        if (usuarios.existsByEmail(email)) {
            throw ApiException.conflito("Já existe um usuário com este e-mail.");
        }
        SenhaPolitica.validar(req.senha());
        Usuario u = new Usuario();
        u.setSenhaHash(encoder.encode(req.senha()));
        aplicar(u, req, email);
        Usuario salvo = usuarios.save(u);
        auditoria.registrar("USUARIO", salvo.getId(), AcaoAuditoria.CRIACAO,
                "email=" + email + ", perfil=" + req.perfil());
        return UsuarioResponse.from(salvo);
    }

    /**
     * Mudança de senha, perfil, escola ou situação (ativo) revoga os tokens já emitidos do usuário e é auditada.
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse atualizar(Long id, UsuarioRequest req) {
        Usuario u = obter(id);
        String email = normalizar(req.email());
        if (usuarios.existsByEmailAndIdNot(email, id)) {
            throw ApiException.conflito("Já existe um usuário com este e-mail.");
        }
        boolean ativo = req.ativo() == null || req.ativo();
        if (id.equals(contexto.atual().id()) && (!ativo || req.perfil() != PerfilNome.ADMIN)) {
            throw ApiException.regraDeNegocio("Você não pode desativar nem rebaixar o seu próprio usuário.");
        }

        String perfilAntes = u.getPerfil().getNome();
        Long escolaAntes = idEscola(u);
        boolean ativoAntes = u.isAtivo();

        boolean senhaRedefinida = req.senha() != null && !req.senha().isBlank();
        if (senhaRedefinida) {
            SenhaPolitica.validar(req.senha());
            u.setSenhaHash(encoder.encode(req.senha()));
        }
        aplicar(u, req, email);

        List<String> mudancas = new ArrayList<>();
        if (senhaRedefinida) {
            mudancas.add("senha redefinida");
        }
        if (ativoAntes != u.isAtivo()) {
            mudancas.add("ativo: " + ativoAntes + " -> " + u.isAtivo());
        }
        if (!perfilAntes.equals(u.getPerfil().getNome())) {
            mudancas.add("perfil: " + perfilAntes + " -> " + u.getPerfil().getNome());
        }
        if (!Objects.equals(escolaAntes, idEscola(u))) {
            mudancas.add("escola: " + escolaAntes + " -> " + idEscola(u));
        }
        if (!mudancas.isEmpty()) {
            u.revogarTokens();
        }
        auditoria.registrar("USUARIO", id, AcaoAuditoria.ATUALIZACAO,
                mudancas.isEmpty() ? "dados cadastrais" : String.join("; ", mudancas));
        return UsuarioResponse.from(u);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void excluir(Long id) {
        if (id.equals(contexto.atual().id())) {
            throw ApiException.regraDeNegocio("Você não pode excluir o seu próprio usuário.");
        }
        Usuario u = obter(id);
        auditoria.registrar("USUARIO", id, AcaoAuditoria.EXCLUSAO, "email=" + u.getEmail());
        usuarios.delete(u);
        usuarios.flush();   // força a verificação de vínculos (FK) aqui, devolvendo 409 em vez de falhar no commit
    }

    private void aplicar(Usuario u, UsuarioRequest req, String email) {
        Perfil perfil = perfis.findByNome(req.perfil().name())
                .orElseThrow(() -> ApiException.naoEncontrado("Perfil", req.perfil()));
        Escola escola = req.escolaId() == null ? null : escolas.findById(req.escolaId())
                .orElseThrow(() -> ApiException.naoEncontrado("Escola", req.escolaId()));
        if (req.perfil() == PerfilNome.SECRETARIO && escola == null) {
            throw ApiException.regraDeNegocio("Usuários com perfil SECRETARIO devem ser vinculados a uma escola.");
        }
        u.setNome(req.nome().trim());
        u.setEmail(email);
        u.setPerfil(perfil);
        u.setEscola(escola);
        u.setAtivo(req.ativo() == null || req.ativo());
    }

    private Long idEscola(Usuario u) {
        return u.getEscola() == null ? null : u.getEscola().getId();
    }

    private Usuario obter(Long id) {
        return usuarios.findComPerfilById(id).orElseThrow(() -> ApiException.naoEncontrado("Usuário", id));
    }

    private String normalizar(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

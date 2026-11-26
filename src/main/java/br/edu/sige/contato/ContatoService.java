package br.edu.sige.contato;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import br.edu.sige.acesso.AcessoService;
import br.edu.sige.escola.Escola;
import br.edu.sige.escola.EscolaRepository;
import br.edu.sige.common.ApiException;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.professor.Professor;
import br.edu.sige.usuario.Usuario;
import br.edu.sige.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
public class ContatoService {

    private final EscolaRepository escolas;
    private final UsuarioRepository usuarios;
    private final AcessoService acesso;

    public List<ContatoEscolaResponse> listar() {
        Long escolaRestrita;
        if (acesso.usuario().perfil() == PerfilNome.PROFESSOR) {
            escolaRestrita = acesso.usuario().escolaId();
            if (escolaRestrita == null) {
                throw ApiException.proibido("Usuário sem unidade escolar vinculada. Procure a administração.");
            }
        } else {
            escolaRestrita = acesso.escolaRestrita();
        }
        Long escolaFiltro = escolaRestrita;
        return escolas.findAll().stream()
                .filter(escola -> escolaFiltro == null || escolaFiltro.equals(escola.getId()))
                .map(this::mapear)
                .toList();
    }

    private ContatoEscolaResponse mapear(Escola escola) {
        List<ContatoEscolaResponse.PessoaContato> contatos = new java.util.ArrayList<>();
        Professor diretor = escola.getDiretor();
        if (diretor != null) {
            String email = diretor.getUsuario() != null ? diretor.getUsuario().getEmail() : diretor.getEmail();
            contatos.add(new ContatoEscolaResponse.PessoaContato("Gestor/Direção", diretor.getNome(), email,
                    diretor.getTelefone()));
        }
        usuarios.findByEscolaId(escola.getId(), Pageable.unpaged()).getContent().stream()
                .filter(u -> u.getPerfil().getNome().equals("SECRETARIO"))
                .map(u -> new ContatoEscolaResponse.PessoaContato("Secretaria escolar", u.getNome(), u.getEmail(), null))
                .forEach(contatos::add);
        return new ContatoEscolaResponse(escola.getId(), escola.getNome(), escola.getEmail(),
                escola.getTelefone(), contatos);
    }
}

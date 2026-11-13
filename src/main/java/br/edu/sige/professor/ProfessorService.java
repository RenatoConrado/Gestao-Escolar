package br.edu.sige.professor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.common.ApiException;
import br.edu.sige.escola.Escola;
import br.edu.sige.escola.EscolaRepository;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.usuario.Usuario;
import br.edu.sige.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfessorService {

    private final ProfessorRepository professores;
    private final EscolaRepository escolas;
    private final UsuarioRepository usuarios;
    private final AcessoService acesso;

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','LEITOR')")
    public Page<ProfessorResponse> listar(Pageable pageable) {
        boolean exibirCpf = acesso.podeVerDadosPessoais();
        Long escolaId = acesso.escolaRestrita();
        Page<Professor> pagina = escolaId != null
                ? professores.findByEscolaId(escolaId, pageable)
                : professores.findAll(pageable);
        return pagina.map(p -> ProfessorResponse.from(p, exibirCpf));
    }

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','LEITOR')")
    public ProfessorResponse buscar(Long id) {
        Professor p = obter(id);
        Long escolaId = acesso.escolaRestrita();
        if (escolaId != null && !escolaId.equals(p.getEscola().getId())) {
            throw ApiException.proibido("Acesso negado: professor de outra unidade escolar.");
        }
        return ProfessorResponse.from(p, acesso.podeVerDadosPessoais());
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public ProfessorResponse criar(ProfessorRequest req) {
        acesso.exigirEscolaDoSecretario(req.escolaId());
        if (professores.existsByMatricula(req.matricula().trim())) {
            throw ApiException.conflito("Já existe um professor com esta matrícula.");
        }
        if (professores.existsByCpf(req.cpf())) {
            throw ApiException.conflito("Já existe um professor com este CPF.");
        }
        Professor p = new Professor();
        aplicar(p, req, null);
        return ProfessorResponse.from(professores.save(p), true);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public ProfessorResponse atualizar(Long id, ProfessorRequest req) {
        Professor p = obter(id);
        Escola escolaAnterior = p.getEscola();
        acesso.exigirEscolaDoSecretario(escolaAnterior.getId());
        acesso.exigirEscolaDoSecretario(req.escolaId());
        if (professores.existsByMatriculaAndIdNot(req.matricula().trim(), id)) {
            throw ApiException.conflito("Já existe um professor com esta matrícula.");
        }
        if (professores.existsByCpfAndIdNot(req.cpf(), id)) {
            throw ApiException.conflito("Já existe um professor com este CPF.");
        }
        if (!escolaAnterior.getId().equals(req.escolaId())) {
            if (escolaAnterior.getDiretor() != null && id.equals(escolaAnterior.getDiretor().getId())) {
                escolaAnterior.setDiretor(null);
            }
            escolas.findByDiretorId(id).forEach(e -> e.setDiretor(null));
        }
        aplicar(p, req, id);
        return ProfessorResponse.from(p, true);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public void excluir(Long id) {
        Professor p = obter(id);
        acesso.exigirEscolaDoSecretario(p.getEscola().getId());
        professores.delete(p);
        professores.flush();
    }

    private void aplicar(Professor p, ProfessorRequest req, Long professorId) {
        Escola escola = escolas.findById(req.escolaId())
                .orElseThrow(() -> ApiException.naoEncontrado("Escola", req.escolaId()));
        p.setMatricula(req.matricula().trim());
        p.setNome(req.nome().trim());
        p.setCpf(req.cpf());
        p.setEmail(req.email());
        p.setTelefone(req.telefone());
        p.setFormacao(req.formacao());
        p.setEscola(escola);
        p.setUsuario(resolverUsuario(req.usuarioId(), professorId));
    }

    private Usuario resolverUsuario(Long usuarioId, Long professorId) {
        if (usuarioId == null) {
            return null;
        }
        Usuario u = usuarios.findComPerfilById(usuarioId)
                .orElseThrow(() -> ApiException.naoEncontrado("Usuário", usuarioId));
        if (!PerfilNome.PROFESSOR.name().equals(u.getPerfil().getNome())) {
            throw ApiException.regraDeNegocio("O usuário vinculado deve ter o perfil PROFESSOR.");
        }
        boolean jaVinculado = professorId == null
                ? professores.existsByUsuarioId(usuarioId)
                : professores.existsByUsuarioIdAndIdNot(usuarioId, professorId);
        if (jaVinculado) {
            throw ApiException.conflito("Este usuário já está vinculado a outro professor.");
        }
        return u;
    }

    private Professor obter(Long id) {
        return professores.findComEscolaById(id).orElseThrow(() -> ApiException.naoEncontrado("Professor", id));
    }
}

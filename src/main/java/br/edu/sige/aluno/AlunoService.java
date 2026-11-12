package br.edu.sige.aluno;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.common.ApiException;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.UsuarioAutenticado;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlunoService {

    private final AlunoRepository alunos;
    private final AcessoService acesso;

    public Page<AlunoResponse> listar(String nome, Pageable pageable) {
        UsuarioAutenticado u = acesso.usuario();
        String filtroNome = (nome == null || nome.isBlank()) ? null : nome.trim();
        Page<Aluno> pagina;
        if (u != null && u.perfil() == PerfilNome.PROFESSOR) {
            pagina = alunos.findDoProfessor(u.id(), filtroNome, pageable);
        } else {
            Long escolaId = acesso.escolaRestrita();
            if (escolaId != null) {
                pagina = alunos.findPorEscola(escolaId, filtroNome, pageable);
            } else {
                pagina = filtroNome == null
                        ? alunos.findAll(pageable)
                        : alunos.findByNomeContainingIgnoreCase(filtroNome, pageable);
            }
        }
        boolean exibirCpf = acesso.podeVerDadosPessoais();
        boolean omitirContato = u != null && u.perfil() == PerfilNome.PROFESSOR;
        return pagina.map(a -> AlunoResponse.from(a, exibirCpf, omitirContato));
    }

    public AlunoResponse buscar(Long id) {
        Aluno a = obter(id);
        exigirAcessoAoAluno(a);
        UsuarioAutenticado u = acesso.usuario();
        boolean omitirContato = u != null && u.perfil() == PerfilNome.PROFESSOR;
        return AlunoResponse.from(a, acesso.podeVerDadosPessoais(), omitirContato);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public AlunoResponse criar(AlunoRequest req) {
        acesso.escolaRestrita();
        String matricula = req.matricula().trim();
        if (alunos.existsByMatricula(matricula)) {
            throw ApiException.conflito("Já existe um aluno com esta matrícula.");
        }
        if (req.cpf() != null && alunos.existsByCpf(req.cpf())) {
            throw ApiException.conflito("Já existe um aluno com este CPF.");
        }
        Aluno a = new Aluno();
        aplicar(a, req);
        return AlunoResponse.from(alunos.save(a), true);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public AlunoResponse atualizar(Long id, AlunoRequest req) {
        Aluno a = obter(id);
        exigirAcessoAoAluno(a);
        if (alunos.existsByMatriculaAndIdNot(req.matricula().trim(), id)) {
            throw ApiException.conflito("Já existe um aluno com esta matrícula.");
        }
        if (req.cpf() != null && alunos.existsByCpfAndIdNot(req.cpf(), id)) {
            throw ApiException.conflito("Já existe um aluno com este CPF.");
        }
        aplicar(a, req);
        return AlunoResponse.from(a, true);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public void excluir(Long id) {
        Aluno a = obter(id);
        exigirAcessoAoAluno(a);
        alunos.delete(a);
        alunos.flush();
    }

    private void exigirAcessoAoAluno(Aluno a) {
        UsuarioAutenticado u = acesso.usuario();
        if (u != null && u.perfil() == PerfilNome.PROFESSOR) {
            if (!alunos.pertenceAoProfessor(a.getId(), u.id())) {
                throw ApiException.proibido("Acesso negado: o aluno não pertence às suas turmas ativas.");
            }
            return;
        }
        Long escolaId = acesso.escolaRestrita();
        if (escolaId != null && !alunos.pertenceAEscola(a.getId(), escolaId)) {
            throw ApiException.proibido("Acesso negado: aluno de outra unidade escolar.");
        }
    }

    private void aplicar(Aluno a, AlunoRequest req) {
        a.setMatricula(req.matricula().trim());
        a.setNome(req.nome().trim());
        a.setDataNascimento(req.dataNascimento());
        a.setCpf(req.cpf());
        a.setEndereco(req.endereco());
        a.setTelefone(req.telefone());
        a.setResponsavel(req.responsavel());
    }

    private Aluno obter(Long id) {
        return alunos.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Aluno", id));
    }
}

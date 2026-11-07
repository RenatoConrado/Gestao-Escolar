package br.edu.sige.aluno;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.common.ApiException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlunoService {

    private final AlunoRepository alunos;
    private final AcessoService acesso;

    public Page<AlunoResponse> listar(String nome, Pageable pageable) {
        boolean exibirCpf = acesso.podeVerDadosPessoais();
        Page<Aluno> pagina = (nome == null || nome.isBlank())
                ? alunos.findAll(pageable)
                : alunos.findByNomeContainingIgnoreCase(nome.trim(), pageable);
        return pagina.map(a -> AlunoResponse.from(a, exibirCpf));
    }

    public AlunoResponse buscar(Long id) {
        return AlunoResponse.from(obter(id), acesso.podeVerDadosPessoais());
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public AlunoResponse criar(AlunoRequest req) {
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
        alunos.delete(obter(id));
        alunos.flush();
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

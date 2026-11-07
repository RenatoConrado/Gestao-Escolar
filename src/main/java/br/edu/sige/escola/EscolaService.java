package br.edu.sige.escola;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.common.ApiException;
import br.edu.sige.professor.Professor;
import br.edu.sige.professor.ProfessorRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EscolaService {

    private final EscolaRepository escolas;
    private final ProfessorRepository professores;

    public Page<EscolaResponse> listar(Pageable pageable) {
        return escolas.findAll(pageable).map(EscolaResponse::from);
    }

    public EscolaResponse buscar(Long id) {
        return EscolaResponse.from(obter(id));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public EscolaResponse criar(EscolaRequest req) {
        if (escolas.existsByCodigo(req.codigo().trim())) {
            throw ApiException.conflito("Já existe uma escola com este código.");
        }
        Escola e = new Escola();
        aplicar(e, req);
        return EscolaResponse.from(escolas.save(e));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public EscolaResponse atualizar(Long id, EscolaRequest req) {
        Escola e = obter(id);
        if (escolas.existsByCodigoAndIdNot(req.codigo().trim(), id)) {
            throw ApiException.conflito("Já existe uma escola com este código.");
        }
        aplicar(e, req);
        return EscolaResponse.from(e);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void excluir(Long id) {
        escolas.delete(obter(id));
        escolas.flush();
    }

    private void aplicar(Escola e, EscolaRequest req) {
        Professor diretor = null;
        if (req.diretorId() != null) {
            if (e.getId() == null) {
                throw ApiException.regraDeNegocio("Defina o diretor após cadastrar os professores da escola.");
            }
            diretor = professores.findById(req.diretorId())
                    .orElseThrow(() -> ApiException.naoEncontrado("Professor", req.diretorId()));
            if (!diretor.getEscola().getId().equals(e.getId())) {
                throw ApiException.regraDeNegocio("O diretor deve ser um professor lotado nesta escola.");
            }
        }
        e.setNome(req.nome().trim());
        e.setCodigo(req.codigo().trim());
        e.setEndereco(req.endereco());
        e.setTelefone(req.telefone());
        e.setEmail(req.email());
        e.setDiretor(diretor);
    }

    private Escola obter(Long id) {
        return escolas.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Escola", id));
    }
}

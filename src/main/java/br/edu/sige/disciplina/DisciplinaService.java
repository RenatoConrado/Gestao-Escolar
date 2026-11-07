package br.edu.sige.disciplina;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.common.ApiException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DisciplinaService {

    private final DisciplinaRepository disciplinas;

    public Page<DisciplinaResponse> listar(Pageable pageable) {
        return disciplinas.findAll(pageable).map(DisciplinaResponse::from);
    }

    public DisciplinaResponse buscar(Long id) {
        return DisciplinaResponse.from(obter(id));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public DisciplinaResponse criar(DisciplinaRequest req) {
        if (disciplinas.existsByCodigo(req.codigo().trim())) {
            throw ApiException.conflito("Já existe uma disciplina com este código.");
        }
        Disciplina d = new Disciplina();
        d.setNome(req.nome().trim());
        d.setCodigo(req.codigo().trim());
        return DisciplinaResponse.from(disciplinas.save(d));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public DisciplinaResponse atualizar(Long id, DisciplinaRequest req) {
        Disciplina d = obter(id);
        if (disciplinas.existsByCodigoAndIdNot(req.codigo().trim(), id)) {
            throw ApiException.conflito("Já existe uma disciplina com este código.");
        }
        d.setNome(req.nome().trim());
        d.setCodigo(req.codigo().trim());
        return DisciplinaResponse.from(d);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public void excluir(Long id) {
        disciplinas.delete(obter(id));
        disciplinas.flush();
    }

    private Disciplina obter(Long id) {
        return disciplinas.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Disciplina", id));
    }
}

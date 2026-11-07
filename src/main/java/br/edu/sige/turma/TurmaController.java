package br.edu.sige.turma;

import io.swagger.v3.oas.annotations.tags.Tag;

import java.net.URI;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.edu.sige.aluno.AlunoResumoResponse;
import br.edu.sige.common.PageResponse;
import br.edu.sige.matricula.MatriculaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Leitura: todos (PROFESSOR só enxerga as próprias turmas). Escrita: ADMIN e SECRETARIO (da própria escola). */
@Tag(name = "Turmas")
@RestController
@RequestMapping("/api/turmas")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
@RequiredArgsConstructor
public class TurmaController {

    private final TurmaService service;
    private final MatriculaService matriculaService;

    @GetMapping
    public PageResponse<TurmaResponse> listar(Pageable pageable) {
        return PageResponse.of(service.listar(pageable));
    }

    @GetMapping("/{id}")
    public TurmaResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    /** Alunos com matrícula ativa na turma (base do diário de classe / chamada no celular). */
    @GetMapping("/{id}/alunos")
    public List<AlunoResumoResponse> alunos(@PathVariable Long id) {
        return matriculaService.alunosAtivosDaTurma(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public ResponseEntity<TurmaResponse> criar(@Valid @RequestBody TurmaRequest req) {
        TurmaResponse criada = service.criar(req);
        return ResponseEntity.created(URI.create("/api/turmas/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public TurmaResponse atualizar(@PathVariable Long id, @Valid @RequestBody TurmaRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

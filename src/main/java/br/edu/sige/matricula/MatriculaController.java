package br.edu.sige.matricula;

import io.swagger.v3.oas.annotations.tags.Tag;

import java.net.URI;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.edu.sige.common.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Leitura: ADMIN, SECRETARIO e LEITOR. Escrita: ADMIN e SECRETARIO. (PROFESSOR usa GET /api/turmas/{id}/alunos.) */
@Tag(name = "Matrículas")
@RestController
@RequestMapping("/api/matriculas")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','LEITOR')")
@RequiredArgsConstructor
public class MatriculaController {

    private final MatriculaService service;

    @GetMapping
    public PageResponse<MatriculaResponse> listar(@RequestParam(required = false) Long turmaId, Pageable pageable) {
        return PageResponse.of(service.listar(turmaId, pageable));
    }

    @GetMapping("/{id}")
    public MatriculaResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public ResponseEntity<MatriculaResponse> criar(@Valid @RequestBody MatriculaRequest req) {
        MatriculaResponse criada = service.criar(req);
        return ResponseEntity.created(URI.create("/api/matriculas/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public MatriculaResponse atualizar(@PathVariable Long id, @Valid @RequestBody MatriculaRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

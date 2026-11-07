package br.edu.sige.professor;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.edu.sige.common.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Leitura: ADMIN, SECRETARIO e LEITOR. Escrita: ADMIN e SECRETARIO. PROFESSOR não acessa este módulo. */
@Tag(name = "Professores")
@RestController
@RequestMapping("/api/professores")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','LEITOR')")
@RequiredArgsConstructor
public class ProfessorController {

    private final ProfessorService service;

    @GetMapping
    public PageResponse<ProfessorResponse> listar(Pageable pageable) {
        return PageResponse.of(service.listar(pageable));
    }

    @GetMapping("/{id}")
    public ProfessorResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public ResponseEntity<ProfessorResponse> criar(@Valid @RequestBody ProfessorRequest req) {
        ProfessorResponse criado = service.criar(req);
        return ResponseEntity.created(URI.create("/api/professores/" + criado.id())).body(criado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public ProfessorResponse atualizar(@PathVariable Long id, @Valid @RequestBody ProfessorRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

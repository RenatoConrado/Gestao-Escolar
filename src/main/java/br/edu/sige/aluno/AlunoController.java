package br.edu.sige.aluno;

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

/** Leitura: todos os perfis. Escrita: ADMIN e SECRETARIO. */
@Tag(name = "Alunos")
@RestController
@RequestMapping("/api/alunos")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
@RequiredArgsConstructor
public class AlunoController {

    private final AlunoService service;

    @GetMapping
    public PageResponse<AlunoResponse> listar(@RequestParam(required = false) String nome, Pageable pageable) {
        return PageResponse.of(service.listar(nome, pageable));
    }

    @GetMapping("/{id}")
    public AlunoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public ResponseEntity<AlunoResponse> criar(@Valid @RequestBody AlunoRequest req) {
        AlunoResponse criado = service.criar(req);
        return ResponseEntity.created(URI.create("/api/alunos/" + criado.id())).body(criado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public AlunoResponse atualizar(@PathVariable Long id, @Valid @RequestBody AlunoRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

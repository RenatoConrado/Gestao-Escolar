package br.edu.sige.atribuicao;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.edu.sige.common.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Leitura geral: ADMIN, SECRETARIO e LEITOR. /minhas: PROFESSOR. Escrita: ADMIN e SECRETARIO. */
@Tag(name = "Atribuições docentes")
@RestController
@RequestMapping("/api/atribuicoes")
@RequiredArgsConstructor
public class AtribuicaoController {

    private final AtribuicaoService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','LEITOR')")
    public PageResponse<AtribuicaoResponse> listar(@RequestParam(required = false) Long turmaId, Pageable pageable) {
        return PageResponse.of(service.listar(turmaId, pageable));
    }

    @GetMapping("/minhas")
    @PreAuthorize("hasRole('PROFESSOR')")
    public List<AtribuicaoResponse> minhas() {
        return service.minhas();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','LEITOR')")
    public AtribuicaoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public ResponseEntity<AtribuicaoResponse> criar(@Valid @RequestBody AtribuicaoRequest req) {
        AtribuicaoResponse criada = service.criar(req);
        return ResponseEntity.created(URI.create("/api/atribuicoes/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public AtribuicaoResponse atualizar(@PathVariable Long id, @Valid @RequestBody AtribuicaoRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

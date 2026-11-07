package br.edu.sige.escola;

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

/** Leitura: todos os perfis. Escrita: somente ADMIN (SECRETARIO tem apenas leitura da estrutura de escolas). */
@Tag(name = "Escolas")
@RestController
@RequestMapping("/api/escolas")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
@RequiredArgsConstructor
public class EscolaController {

    private final EscolaService service;

    @GetMapping
    public PageResponse<EscolaResponse> listar(Pageable pageable) {
        return PageResponse.of(service.listar(pageable));
    }

    @GetMapping("/{id}")
    public EscolaResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EscolaResponse> criar(@Valid @RequestBody EscolaRequest req) {
        EscolaResponse criada = service.criar(req);
        return ResponseEntity.created(URI.create("/api/escolas/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public EscolaResponse atualizar(@PathVariable Long id, @Valid @RequestBody EscolaRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

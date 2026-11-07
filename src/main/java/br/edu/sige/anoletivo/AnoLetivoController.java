package br.edu.sige.anoletivo;

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

/** Leitura: todos os perfis. Escrita: somente ADMIN. */
@Tag(name = "Anos letivos")
@RestController
@RequestMapping("/api/anos-letivos")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
@RequiredArgsConstructor
public class AnoLetivoController {

    private final AnoLetivoService service;

    @GetMapping
    public PageResponse<AnoLetivoResponse> listar(Pageable pageable) {
        return PageResponse.of(service.listar(pageable));
    }

    @GetMapping("/{id}")
    public AnoLetivoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnoLetivoResponse> criar(@Valid @RequestBody AnoLetivoRequest req) {
        AnoLetivoResponse criado = service.criar(req);
        return ResponseEntity.created(URI.create("/api/anos-letivos/" + criado.id())).body(criado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AnoLetivoResponse atualizar(@PathVariable Long id, @Valid @RequestBody AnoLetivoRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

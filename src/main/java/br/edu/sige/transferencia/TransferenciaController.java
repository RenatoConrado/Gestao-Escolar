package br.edu.sige.transferencia;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.net.URI;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import br.edu.sige.common.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Transferências de alunos")
@RestController
@RequestMapping("/api/transferencias")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
@RequiredArgsConstructor
public class TransferenciaController {

    private final TransferenciaService service;

    @GetMapping
    public PageResponse<TransferenciaResponse> listar(Pageable pageable) {
        return PageResponse.of(service.listar(pageable));
    }

    @PostMapping
    public ResponseEntity<TransferenciaResponse> solicitar(@Valid @RequestBody SolicitarTransferenciaRequest req) {
        TransferenciaResponse criada = service.solicitar(req);
        return ResponseEntity.created(URI.create("/api/transferencias/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}/decisao")
    public TransferenciaResponse decidir(@PathVariable Long id,
                                         @Valid @RequestBody DecidirTransferenciaRequest req) {
        return service.decidir(id, req);
    }
}

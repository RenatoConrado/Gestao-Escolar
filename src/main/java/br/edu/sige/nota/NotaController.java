package br.edu.sige.nota;

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

/** Lançamento: ADMIN e PROFESSOR (somente suas atribuições). Leitura: todos, dentro do escopo. */
@Tag(name = "Notas")
@RestController
@RequestMapping("/api/notas")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
@RequiredArgsConstructor
public class NotaController {

    private final NotaService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    public ResponseEntity<NotaResponse> lancarNota(@Valid @RequestBody NotaRequest req) {
        NotaResponse criada = service.lancar(req);
        return ResponseEntity.created(URI.create("/api/notas/" + criada.id())).body(criada);
    }

    @GetMapping("/turma/{turmaId}")
    public PageResponse<NotaResponse> listarNotasPorTurma(@PathVariable Long turmaId, Pageable pageable) {
        return PageResponse.of(service.listarPorTurma(turmaId, pageable));
    }

    @GetMapping("/avaliacao/{avaliacaoId}")
    public PageResponse<NotaResponse> listarNotasPorAvaliacao(@PathVariable Long avaliacaoId, Pageable pageable) {
        return PageResponse.of(service.listarPorAvaliacao(avaliacaoId, pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR')")
    public NotaResponse atualizar(@PathVariable Long id, @Valid @RequestBody NotaUpdateRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

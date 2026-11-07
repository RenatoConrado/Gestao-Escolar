package br.edu.sige.frequencia;

import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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

/**
 * Leitura: todos os perfis (dentro do escopo). POST/DELETE: ADMIN e PROFESSOR (somente suas turmas).
 * PUT: também SECRETARIO, como alteração excepcional na sua escola. LEITOR nunca escreve.
 */
@Tag(name = "Frequências")
@RestController
@RequestMapping("/api/frequencias")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
@RequiredArgsConstructor
public class FrequenciaController {

    private final FrequenciaService service;

    @GetMapping
    public PageResponse<FrequenciaResponse> listar(
            @RequestParam Long turmaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @PageableDefault(size = 50, sort = "data", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.of(service.listar(turmaId, data, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public FrequenciaResponse registrar(@Valid @RequestBody FrequenciaRequest req) {
        return service.registrar(req);
    }

    @PostMapping("/lote")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    public ResponseEntity<List<FrequenciaResponse>> registrarLote(@Valid @RequestBody FrequenciaLoteRequest req) {
        return ResponseEntity.ok(service.registrarLote(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR')")
    public FrequenciaResponse atualizar(@PathVariable Long id, @Valid @RequestBody FrequenciaUpdateRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

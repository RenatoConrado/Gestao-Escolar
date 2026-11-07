package br.edu.sige.auditoria;

import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.edu.sige.common.PageResponse;
import lombok.RequiredArgsConstructor;

/** Consulta da trilha de auditoria: somente ADMIN. Entidades: NOTA, FREQUENCIA, FREQUENCIA_TURMA, AVALIACAO, USUARIO. */
@Tag(name = "Auditoria")
@RestController
@RequestMapping("/api/auditoria")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AuditoriaController {

    private final AuditoriaService service;

    @GetMapping
    public PageResponse<EventoAuditoriaResponse> consultar(
            @RequestParam(required = false) String entidade,
            @RequestParam(required = false) Long entidadeId,
            @PageableDefault(size = 50, sort = "em", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.of(service.consultar(entidade, entidadeId, pageable));
    }
}

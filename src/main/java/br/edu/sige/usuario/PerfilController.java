package br.edu.sige.usuario;

import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/** Perfis são imutáveis (as regras de acesso estão no código); por isso o módulo é somente leitura. */
@Tag(name = "Perfis")
@RestController
@RequestMapping("/api/perfis")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
@RequiredArgsConstructor
public class PerfilController {

    public record PerfilResponse(Long id, String nome) {
    }

    private final PerfilRepository perfis;

    @GetMapping
    public List<PerfilResponse> listar() {
        return perfis.findAll().stream().map(p -> new PerfilResponse(p.getId(), p.getNome())).toList();
    }
}

package br.edu.sige.contato;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

@Tag(name = "Contatos escolares")
@RestController
@RequestMapping("/api/contatos")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
@RequiredArgsConstructor
public class ContatoController {

    private final ContatoService service;

    @GetMapping
    public List<ContatoEscolaResponse> listar() {
        return service.listar();
    }
}

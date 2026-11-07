package br.edu.sige.relatorio;

import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/** Somente leitura; o conteúdo é filtrado pelo escopo do perfil (ver {@link RelatorioService}). */
@Tag(name = "Relatórios")
@RestController
@RequestMapping("/api/relatorios")
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioService service;

    @GetMapping("/resumo")
    public ResumoResponse resumo() {
        return service.resumo();
    }

    @GetMapping("/turmas/{turmaId}/frequencia")
    public List<FrequenciaAlunoResponse> frequencia(@PathVariable Long turmaId) {
        return service.frequenciaDaTurma(turmaId);
    }

    @GetMapping("/alunos/{alunoId}")
    public BoletimAlunoResponse boletimDoAluno(@PathVariable Long alunoId) {
        return service.boletimDoAluno(alunoId);
    }
}

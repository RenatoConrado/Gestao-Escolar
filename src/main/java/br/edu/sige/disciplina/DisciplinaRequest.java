package br.edu.sige.disciplina;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisciplinaRequest(
        @NotBlank @Size(max = 100) String nome,
        @NotBlank @Size(max = 30) String codigo) {
}

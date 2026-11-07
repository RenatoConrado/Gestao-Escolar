package br.edu.sige.turma;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TurmaRequest(
        @NotBlank @Size(max = 100) String nome,
        @NotBlank @Size(max = 30) String serie,
        @NotNull Turno turno,
        @NotNull Long anoLetivoId,
        @NotNull Long escolaId) {
}

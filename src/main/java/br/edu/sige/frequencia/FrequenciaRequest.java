package br.edu.sige.frequencia;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FrequenciaRequest(
        @NotNull Long alunoId,
        @NotNull Long turmaId,
        @NotNull LocalDate data,
        @NotNull Boolean presente,
        @Size(max = 255) String observacao) {
}

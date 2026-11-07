package br.edu.sige.anoletivo;

import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AnoLetivoRequest(
        @NotNull @Min(2000) @Max(2100) Integer ano,
        @NotNull LocalDate dataInicio,
        @NotNull LocalDate dataFim) {
}

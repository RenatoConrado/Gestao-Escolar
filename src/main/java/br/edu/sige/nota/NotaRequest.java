package br.edu.sige.nota;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

public record NotaRequest(
        @NotNull Long alunoId,
        @NotNull Long avaliacaoId,
        @NotNull @DecimalMin("0.00") @Digits(integer = 3, fraction = 2) BigDecimal valor) {
}

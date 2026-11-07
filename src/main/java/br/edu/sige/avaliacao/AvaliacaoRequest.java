package br.edu.sige.avaliacao;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AvaliacaoRequest(
        @NotNull Long atribuicaoId,
        @NotBlank @Size(max = 150) String nome,
        @NotNull LocalDate data,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 3, fraction = 2) BigDecimal valorMaximo) {
}

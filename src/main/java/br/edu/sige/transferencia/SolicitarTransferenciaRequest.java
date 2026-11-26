package br.edu.sige.transferencia;

import jakarta.validation.constraints.NotNull;

public record SolicitarTransferenciaRequest(@NotNull Long alunoId, @NotNull Long escolaDestinoId) {
}

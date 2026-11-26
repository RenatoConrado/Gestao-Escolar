package br.edu.sige.transferencia;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DecidirTransferenciaRequest(
        @NotNull Boolean aceitar,
        Long turmaDestinoId,
        @Size(max = 500) String justificativa) {
}

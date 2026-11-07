package br.edu.sige.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Campo obrigatório") @Size(max = 150, message = "Máximo de 150 caracteres") String email,
        @NotBlank(message = "Campo obrigatório") @Size(max = 200, message = "Máximo de 200 caracteres") String senha) {
}

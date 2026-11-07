package br.edu.sige.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlterarSenhaRequest(
        @NotBlank(message = "Campo obrigatório") @Size(max = 200) String senhaAtual,
        @NotBlank(message = "Campo obrigatório") @Size(max = 200) String novaSenha) {
}

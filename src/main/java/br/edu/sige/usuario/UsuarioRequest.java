package br.edu.sige.usuario;

import br.edu.sige.security.PerfilNome;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** {@code senha} é obrigatória no cadastro e opcional na atualização (se informada, troca a senha). */
public record UsuarioRequest(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Email @Size(max = 150) String email,
        @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres") String senha,
        @NotNull PerfilNome perfil,
        Long escolaId,
        Boolean ativo) {
}

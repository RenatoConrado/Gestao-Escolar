package br.edu.sige.escola;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** {@code diretorId} só pode ser definido na atualização (o professor precisa pertencer à escola). */
public record EscolaRequest(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Size(max = 30) String codigo,
        @Size(max = 255) String endereco,
        @Size(max = 20) String telefone,
        @Email @Size(max = 150) String email,
        Long diretorId) {
}

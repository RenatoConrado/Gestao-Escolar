package br.edu.sige.aluno;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

/** {@code cpf} é opcional (omita ou envie null); quando informado, deve ter 11 dígitos numéricos. */
public record AlunoRequest(
        @NotBlank @Size(max = 30) @Pattern(regexp = "[A-Za-z0-9./-]{1,30}",
                message = "Matrícula deve conter apenas letras, números, ponto, barra ou hífen") String matricula,
        @NotBlank @Size(max = 150) String nome,
        @NotNull @Past LocalDate dataNascimento,
        @Pattern(regexp = "\\d{11}", message = "CPF deve conter 11 dígitos numéricos") String cpf,
        @Size(max = 255) String endereco,
        @Size(max = 20) @Pattern(regexp = "^$|(?:\\+?55\\s?)?\\(?\\d{2}\\)?[\\s.-]?\\d{4,5}[-.\\s]?\\d{4}",
                message = "Telefone inválido. Use (DD) 00000-0000") String telefone,
        @Size(max = 150) String responsavel) {
}

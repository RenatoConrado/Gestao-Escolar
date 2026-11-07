package br.edu.sige.frequencia;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Só o status e a observação podem ser corrigidos; aluno, turma e data identificam o registro. */
public record FrequenciaUpdateRequest(
        @NotNull Boolean presente,
        @Size(max = 255) String observacao) {
}

package br.edu.sige.frequencia;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Chamada completa de uma turma em um dia - uma única requisição (ideal para o celular em sala de aula). */
public record FrequenciaLoteRequest(
        @NotNull Long turmaId,
        @NotNull LocalDate data,
        @NotEmpty @Size(max = 100) @Valid List<ItemFrequencia> registros) {

    public record ItemFrequencia(
            @NotNull Long alunoId,
            @NotNull Boolean presente,
            @Size(max = 255) String observacao) {
    }
}

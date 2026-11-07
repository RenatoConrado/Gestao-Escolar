package br.edu.sige.matricula;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

/** {@code situacao} (padrão ATIVA) e {@code dataMatricula} (padrão hoje) são opcionais. O ano letivo vem da turma. */
public record MatriculaRequest(
        @NotNull Long alunoId,
        @NotNull Long turmaId,
        SituacaoMatricula situacao,
        LocalDate dataMatricula) {
}

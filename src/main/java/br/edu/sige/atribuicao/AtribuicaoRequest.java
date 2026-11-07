package br.edu.sige.atribuicao;

import jakarta.validation.constraints.NotNull;

/** O ano letivo é derivado da turma. {@code ativo} (padrão true) permite encerrar uma atribuição sem apagá-la. */
public record AtribuicaoRequest(
        @NotNull Long professorId,
        @NotNull Long turmaId,
        @NotNull Long disciplinaId,
        Boolean ativo) {
}

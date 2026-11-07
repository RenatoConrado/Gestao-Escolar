package br.edu.sige.frequencia;

import java.time.LocalDate;

public record FrequenciaResponse(Long id, Long alunoId, String alunoNome, Long turmaId, LocalDate data,
                                 boolean presente, String observacao) {

    public static FrequenciaResponse from(Frequencia f) {
        return new FrequenciaResponse(f.getId(), f.getAluno().getId(), f.getAluno().getNome(),
                f.getTurma().getId(), f.getData(), f.isPresente(), f.getObservacao());
    }
}

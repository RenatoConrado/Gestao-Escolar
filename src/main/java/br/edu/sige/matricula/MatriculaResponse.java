package br.edu.sige.matricula;

import java.time.LocalDate;

public record MatriculaResponse(Long id, Long alunoId, String alunoNome, Long turmaId, String turmaNome,
                                Long anoLetivoId, SituacaoMatricula situacao, LocalDate dataMatricula) {

    public static MatriculaResponse from(Matricula m) {
        return new MatriculaResponse(m.getId(), m.getAluno().getId(), m.getAluno().getNome(),
                m.getTurma().getId(), m.getTurma().getNome(), m.getAnoLetivo().getId(),
                m.getSituacao(), m.getDataMatricula());
    }
}

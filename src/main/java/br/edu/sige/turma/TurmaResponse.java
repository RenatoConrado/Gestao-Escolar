package br.edu.sige.turma;

public record TurmaResponse(Long id, String nome, String serie, Turno turno, Long anoLetivoId, int anoLetivo,
                            Long escolaId, String escolaNome) {

    public static TurmaResponse from(Turma t) {
        return new TurmaResponse(t.getId(), t.getNome(), t.getSerie(), t.getTurno(),
                t.getAnoLetivo().getId(), t.getAnoLetivo().getAno(),
                t.getEscola().getId(), t.getEscola().getNome());
    }
}

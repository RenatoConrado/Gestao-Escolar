package br.edu.sige.transferencia;

import java.time.Instant;

public record TransferenciaResponse(
        Long id, Long alunoId, String alunoNome, String matricula, String escolaOrigem,
        String escolaDestino, Long escolaDestinoId, Long turmaDestinoId, String turmaDestino,
        Long anoLetivoId, TransferenciaSituacao situacao, String justificativa,
        Instant solicitadaEm, Instant decididaEm) {

    public static TransferenciaResponse from(TransferenciaAluno t) {
        return new TransferenciaResponse(
                t.getId(), t.getAluno().getId(), t.getAluno().getNome(), t.getAluno().getMatricula(),
                t.getMatriculaOrigem().getTurma().getEscola().getNome(), t.getEscolaDestino().getNome(),
                t.getEscolaDestino().getId(), t.getTurmaDestino() == null ? null : t.getTurmaDestino().getId(),
                t.getTurmaDestino() == null ? null : t.getTurmaDestino().getNome(),
                t.getMatriculaOrigem().getAnoLetivo().getId(), t.getSituacao(), t.getJustificativa(),
                t.getSolicitadaEm(), t.getDecididaEm());
    }
}

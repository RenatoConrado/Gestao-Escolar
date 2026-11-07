package br.edu.sige.atribuicao;

public record AtribuicaoResponse(Long id, Long professorId, String professorNome, Long turmaId, String turmaNome,
                                 String serie, String turno, Long escolaId, String escolaNome,
                                 Long disciplinaId, String disciplinaNome, Long anoLetivoId, int anoLetivo,
                                 boolean ativo) {

    public static AtribuicaoResponse from(AtribuicaoDocente a) {
        return new AtribuicaoResponse(a.getId(), a.getProfessor().getId(), a.getProfessor().getNome(),
                a.getTurma().getId(), a.getTurma().getNome(), a.getTurma().getSerie(),
                a.getTurma().getTurno().name(), a.getTurma().getEscola().getId(), a.getTurma().getEscola().getNome(),
                a.getDisciplina().getId(), a.getDisciplina().getNome(), a.getAnoLetivo().getId(),
                a.getAnoLetivo().getAno(), a.isAtivo());
    }
}

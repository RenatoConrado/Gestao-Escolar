package br.edu.sige.disciplina;

public record DisciplinaResponse(Long id, String nome, String codigo) {

    public static DisciplinaResponse from(Disciplina d) {
        return new DisciplinaResponse(d.getId(), d.getNome(), d.getCodigo());
    }
}

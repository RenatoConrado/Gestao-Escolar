package br.edu.sige.aluno;

/** Visão enxuta do aluno (listas de chamada e lançamento de notas). */
public record AlunoResumoResponse(Long id, String matricula, String nome) {

    public static AlunoResumoResponse from(Aluno a) {
        return new AlunoResumoResponse(a.getId(), a.getMatricula(), a.getNome());
    }
}

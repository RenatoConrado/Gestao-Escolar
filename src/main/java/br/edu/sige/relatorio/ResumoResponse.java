package br.edu.sige.relatorio;

/** {@code escopo}: REDE (toda a rede), ESCOLA (unidade do usuário) ou PROFESSOR (suas turmas). Campos nulos = não se aplica. */
public record ResumoResponse(String escopo, long alunosMatriculados, long turmas, Long professores, Long escolas) {
}

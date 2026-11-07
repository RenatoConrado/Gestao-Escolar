package br.edu.sige.frequencia;

/** Projeção da consulta agregada de frequência por aluno. */
public interface ResumoFrequenciaAluno {

    Long getAlunoId();

    String getAlunoNome();

    String getAlunoMatricula();

    Long getTotal();

    Long getPresencas();
}

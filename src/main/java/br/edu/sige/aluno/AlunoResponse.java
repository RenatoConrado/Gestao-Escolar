package br.edu.sige.aluno;

import java.time.LocalDate;

public record AlunoResponse(Long id, String matricula, String nome, LocalDate dataNascimento, String cpf,
                            String endereco, String telefone, String responsavel) {

    /** O CPF só é exposto a quem pode ver dados pessoais (ADMIN e SECRETARIO) - minimização de dados (LGPD). */
    public static AlunoResponse from(Aluno a, boolean exibirCpf) {
        return new AlunoResponse(a.getId(), a.getMatricula(), a.getNome(), a.getDataNascimento(),
                exibirCpf ? a.getCpf() : null, a.getEndereco(), a.getTelefone(), a.getResponsavel());
    }
}

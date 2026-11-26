package br.edu.sige.contato;

import java.util.List;

public record ContatoEscolaResponse(
        Long escolaId, String escolaNome, String emailInstitucional, String telefone,
        List<PessoaContato> contatos) {

    public record PessoaContato(String funcao, String nome, String email, String telefone) {
    }
}

package br.edu.sige.escola;

public record EscolaResponse(Long id, String nome, String codigo, String endereco, String telefone,
                             String email, Long diretorId) {

    public static EscolaResponse from(Escola e) {
        return new EscolaResponse(e.getId(), e.getNome(), e.getCodigo(), e.getEndereco(), e.getTelefone(),
                e.getEmail(), e.getDiretor() == null ? null : e.getDiretor().getId());
    }
}

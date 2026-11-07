package br.edu.sige.nota;

import java.math.BigDecimal;

public record NotaResponse(Long id, Long alunoId, String alunoNome, Long avaliacaoId, String avaliacaoNome,
                           BigDecimal valor, BigDecimal valorMaximo) {

    public static NotaResponse from(Nota n) {
        return new NotaResponse(n.getId(), n.getAluno().getId(), n.getAluno().getNome(),
                n.getAvaliacao().getId(), n.getAvaliacao().getNome(), n.getValor(),
                n.getAvaliacao().getValorMaximo());
    }
}

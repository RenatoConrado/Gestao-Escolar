package br.edu.sige.avaliacao;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AvaliacaoResponse(Long id, Long atribuicaoId, String nome, LocalDate data, BigDecimal valorMaximo) {

    public static AvaliacaoResponse from(Avaliacao a) {
        return new AvaliacaoResponse(a.getId(), a.getAtribuicao().getId(), a.getNome(), a.getData(),
                a.getValorMaximo());
    }
}

package br.edu.sige.anoletivo;

import java.time.LocalDate;

public record AnoLetivoResponse(Long id, int ano, LocalDate dataInicio, LocalDate dataFim) {

    public static AnoLetivoResponse from(AnoLetivo a) {
        return new AnoLetivoResponse(a.getId(), a.getAno(), a.getDataInicio(), a.getDataFim());
    }
}

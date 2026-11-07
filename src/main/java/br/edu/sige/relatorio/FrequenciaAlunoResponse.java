package br.edu.sige.relatorio;

import java.math.BigDecimal;

public record FrequenciaAlunoResponse(Long alunoId, String alunoNome, String matricula, long totalRegistros,
                                      long presencas, long faltas, BigDecimal percentualPresenca) {
}

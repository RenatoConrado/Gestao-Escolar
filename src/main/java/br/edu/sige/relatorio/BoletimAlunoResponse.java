package br.edu.sige.relatorio;

import java.math.BigDecimal;
import java.util.List;

public record BoletimAlunoResponse(
        Long alunoId,
        String alunoNome,
        Long matriculaId,
        String turmaNome,
        String escolaNome,
        Integer anoLetivo,
        Frequencia frequencia,
        List<Disciplina> disciplinas) {

    public record Frequencia(long totalRegistros, long presencas, long faltas, BigDecimal percentualPresenca) {
    }

    public record Disciplina(
            Long disciplinaId,
            String disciplinaNome,
            BigDecimal media,
            List<Avaliacao> avaliacoes) {
    }

    public record Avaliacao(
            Long id,
            String nome,
            java.time.LocalDate data,
            BigDecimal valor,
            BigDecimal valorMaximo) {
    }
}

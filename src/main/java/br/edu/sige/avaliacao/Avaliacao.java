package br.edu.sige.avaliacao;

import java.math.BigDecimal;
import java.time.LocalDate;

import br.edu.sige.atribuicao.AtribuicaoDocente;
import br.edu.sige.common.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "avaliacoes")
public class Avaliacao extends EntidadeBase {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "atribuicao_docente_id")
    private AtribuicaoDocente atribuicao;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false)
    private LocalDate data;

    @Column(name = "valor_maximo", nullable = false, precision = 5, scale = 2)
    private BigDecimal valorMaximo;
}

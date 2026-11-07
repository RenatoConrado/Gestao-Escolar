package br.edu.sige.nota;

import java.math.BigDecimal;

import br.edu.sige.aluno.Aluno;
import br.edu.sige.avaliacao.Avaliacao;
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
@Table(name = "notas")
public class Nota extends EntidadeBase {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aluno_id")
    private Aluno aluno;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "avaliacao_id")
    private Avaliacao avaliacao;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal valor;
}

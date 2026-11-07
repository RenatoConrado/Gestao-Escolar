package br.edu.sige.anoletivo;

import java.time.LocalDate;

import br.edu.sige.common.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "anos_letivos")
public class AnoLetivo extends EntidadeBase {

    @Column(nullable = false, unique = true)
    private int ano;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;
}

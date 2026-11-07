package br.edu.sige.atribuicao;

import br.edu.sige.anoletivo.AnoLetivo;
import br.edu.sige.common.EntidadeBase;
import br.edu.sige.disciplina.Disciplina;
import br.edu.sige.professor.Professor;
import br.edu.sige.turma.Turma;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Vínculo professor x turma x disciplina. É a base de toda a autorização do PROFESSOR no diário de classe. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "atribuicoes_docentes")
public class AtribuicaoDocente extends EntidadeBase {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "professor_id")
    private Professor professor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "turma_id")
    private Turma turma;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "disciplina_id")
    private Disciplina disciplina;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ano_letivo_id")
    private AnoLetivo anoLetivo;

    @Column(nullable = false)
    private boolean ativo = true;
}

package br.edu.sige.transferencia;

import java.time.Instant;

import br.edu.sige.aluno.Aluno;
import br.edu.sige.common.EntidadeBase;
import br.edu.sige.escola.Escola;
import br.edu.sige.matricula.Matricula;
import br.edu.sige.turma.Turma;
import br.edu.sige.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "transferencias_alunos")
public class TransferenciaAluno extends EntidadeBase {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aluno_id")
    private Aluno aluno;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "matricula_origem_id")
    private Matricula matriculaOrigem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "escola_destino_id")
    private Escola escolaDestino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turma_destino_id")
    private Turma turmaDestino;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitante_id")
    private Usuario solicitante;

    @Column(name = "solicitada_em", nullable = false)
    private Instant solicitadaEm = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransferenciaSituacao situacao = TransferenciaSituacao.PENDENTE;

    @Column(length = 500)
    private String justificativa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decidida_por")
    private Usuario decididaPor;

    @Column(name = "decidida_em")
    private Instant decididaEm;
}

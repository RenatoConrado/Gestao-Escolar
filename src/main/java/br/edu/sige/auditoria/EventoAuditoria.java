package br.edu.sige.auditoria;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Registro imutável (append-only) de quem fez o quê; gravado na mesma transação da alteração auditada. */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "auditoria_eventos")
public class EventoAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Instant em;

    @Column(name = "usuario_id", updatable = false)
    private Long usuarioId;

    @Column(length = 20, updatable = false)
    private String perfil;

    @Column(nullable = false, length = 40, updatable = false)
    private String entidade;

    @Column(name = "entidade_id", updatable = false)
    private Long entidadeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, updatable = false)
    private AcaoAuditoria acao;

    @Column(length = 500, updatable = false)
    private String detalhes;

    public EventoAuditoria(Instant em, Long usuarioId, String perfil, String entidade, Long entidadeId,
                           AcaoAuditoria acao, String detalhes) {
        this.em = em;
        this.usuarioId = usuarioId;
        this.perfil = perfil;
        this.entidade = entidade;
        this.entidadeId = entidadeId;
        this.acao = acao;
        this.detalhes = detalhes;
    }
}

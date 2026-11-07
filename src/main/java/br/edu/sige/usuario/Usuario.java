package br.edu.sige.usuario;

import br.edu.sige.common.EntidadeBase;
import br.edu.sige.escola.Escola;
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
@Table(name = "usuarios")
public class Usuario extends EntidadeBase {

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 100)
    private String senhaHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id")
    private Perfil perfil;

    /** Unidade escolar do usuário (obrigatória para SECRETARIO; opcional para LEITOR; ignorada nos demais). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escola_id")
    private Escola escola;

    @Column(nullable = false)
    private boolean ativo = true;

    /** Incrementada para invalidar todos os JWT já emitidos (troca de senha/perfil/escola, desativação). */
    @Column(name = "versao_token", nullable = false)
    private int versaoToken;

    public void revogarTokens() {
        this.versaoToken++;
    }
}

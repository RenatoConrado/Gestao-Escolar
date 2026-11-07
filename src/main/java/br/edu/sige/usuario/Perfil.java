package br.edu.sige.usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Perfis são fixos (ADMIN, SECRETARIO, PROFESSOR, LEITOR) e populados pela migração V1. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "perfis")
public class Perfil {

    @Id
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String nome;
}

package br.edu.sige.security;

/** Perfis fixos do sistema. Os nomes devem coincidir com a tabela {@code perfis} e com as roles do Spring Security. */
public enum PerfilNome {
    ADMIN, SECRETARIO, PROFESSOR, LEITOR;

    public String authority() {
        return "ROLE_" + name();
    }
}

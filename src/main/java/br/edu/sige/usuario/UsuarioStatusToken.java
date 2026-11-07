package br.edu.sige.usuario;

/** Projeção leve usada a cada requisição para validar se o token ainda é aceito. */
public interface UsuarioStatusToken {

    Boolean getAtivo();

    Integer getVersaoToken();
}

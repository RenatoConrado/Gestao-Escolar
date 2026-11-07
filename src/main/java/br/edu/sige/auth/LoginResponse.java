package br.edu.sige.auth;

import java.time.Instant;

import br.edu.sige.usuario.UsuarioResponse;

public record LoginResponse(String token, String tipo, Instant expiraEm, UsuarioResponse usuario) {
}

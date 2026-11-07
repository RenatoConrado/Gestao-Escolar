package br.edu.sige.security;

import java.time.Instant;

public record TokenEmitido(String valor, Instant expiraEm) {
}

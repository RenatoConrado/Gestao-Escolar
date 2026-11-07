package br.edu.sige.security;

import java.nio.charset.StandardCharsets;

import br.edu.sige.common.ApiException;

/** Regras de senha novas. O limite de 72 BYTES vem do BCrypt (acentos ocupam mais de 1 byte). */
public final class SenhaPolitica {

    public static final int MAX_BYTES = 72;

    private SenhaPolitica() {
    }

    public static void validar(String senha) {
        if (senha == null || senha.isBlank() || senha.length() < 8) {
            throw ApiException.regraDeNegocio("A senha deve ter ao menos 8 caracteres.");
        }
        if (excedeLimite(senha)) {
            throw ApiException.regraDeNegocio("A senha deve ter no máximo 72 bytes (reduza o tamanho ou os acentos).");
        }
    }

    public static boolean excedeLimite(String senha) {
        return senha.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES;
    }
}

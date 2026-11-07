package br.edu.sige.common;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpStatus;

/** Corpo padrão de erro devolvido pela API. {@code campos} só é preenchido em erros de validação. */
public record ApiError(Instant timestamp, int status, String error, String message, String path,
                       Map<String, String> campos) {

    public static ApiError of(HttpStatus status, String message, String path, Map<String, String> campos) {
        return new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, path, campos);
    }
}

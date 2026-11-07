package br.edu.sige.common;

import org.springframework.http.HttpStatus;

/** Exceção de negócio com status HTTP associado; tratada em {@link GlobalExceptionHandler}. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final Long retryAfterSegundos;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    public ApiException(HttpStatus status, String message, Long retryAfterSegundos) {
        super(message);
        this.status = status;
        this.retryAfterSegundos = retryAfterSegundos;
    }

    public HttpStatus getStatus() {
        return status;
    }

    /** Preenchido em 429; vira o cabeçalho Retry-After. */
    public Long getRetryAfterSegundos() {
        return retryAfterSegundos;
    }

    public static ApiException naoEncontrado(String recurso, Object id) {
        return new ApiException(HttpStatus.NOT_FOUND, recurso + " não encontrado(a): " + id);
    }

    public static ApiException conflito(String mensagem) {
        return new ApiException(HttpStatus.CONFLICT, mensagem);
    }

    public static ApiException regraDeNegocio(String mensagem) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, mensagem);
    }

    public static ApiException proibido(String mensagem) {
        return new ApiException(HttpStatus.FORBIDDEN, mensagem);
    }

    public static ApiException naoAutenticado(String mensagem) {
        return new ApiException(HttpStatus.UNAUTHORIZED, mensagem);
    }

    public static ApiException muitasRequisicoes(String mensagem, long retryAfterSegundos) {
        return new ApiException(HttpStatus.TOO_MANY_REQUESTS, mensagem, retryAfterSegundos);
    }
}

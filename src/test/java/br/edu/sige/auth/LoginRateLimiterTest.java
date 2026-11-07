package br.edu.sige.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import br.edu.sige.common.ApiException;

class LoginRateLimiterTest {

    /** Relógio controlável para simular a passagem do tempo. */
    static class RelogioMutavel extends Clock {
        private Instant agora = Instant.parse("2026-11-04T10:00:00Z");

        void avancar(Duration d) {
            agora = agora.plus(d);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return agora;
        }
    }

    private final RelogioMutavel relogio = new RelogioMutavel();
    private final LoginRateLimiter limiter =
            new LoginRateLimiter(new LoginLimitProperties(5, 30, Duration.ofMinutes(10)), relogio);

    private void falhar(int vezes, String origem, String conta) {
        for (int i = 0; i < vezes; i++) {
            limiter.registrarFalha(origem, conta);
        }
    }

    @Test
    void bloqueiaAposOLimiteDeFalhasDaMesmaOrigemEConta() {
        falhar(4, "10.0.0.5", "a@sige.local");
        assertThatCode(() -> limiter.verificar("10.0.0.5", "a@sige.local")).doesNotThrowAnyException();

        falhar(1, "10.0.0.5", "a@sige.local");
        assertThatThrownBy(() -> limiter.verificar("10.0.0.5", "a@sige.local"))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                    assertThat(ex.getRetryAfterSegundos()).isPositive();
                });
    }

    @Test
    void outraOrigemNaoEBloqueadaPelaMesmaConta() {
        falhar(5, "10.0.0.5", "a@sige.local");

        assertThatCode(() -> limiter.verificar("10.0.0.9", "a@sige.local")).doesNotThrowAnyException();
    }

    @Test
    void liberaDepoisDaJanela() {
        falhar(5, "10.0.0.5", "a@sige.local");
        relogio.avancar(Duration.ofMinutes(11));

        assertThatCode(() -> limiter.verificar("10.0.0.5", "a@sige.local")).doesNotThrowAnyException();
    }

    @Test
    void sucessoZeraOContadorDaConta() {
        falhar(4, "10.0.0.5", "a@sige.local");
        limiter.registrarSucesso("10.0.0.5", "a@sige.local");
        falhar(4, "10.0.0.5", "a@sige.local");

        assertThatCode(() -> limiter.verificar("10.0.0.5", "a@sige.local")).doesNotThrowAnyException();
    }

    @Test
    void bloqueiaOrigemQueTentaContasDiferentes() {
        for (int i = 0; i < 30; i++) {
            limiter.registrarFalha("10.0.0.7", "conta" + i + "@sige.local");
        }

        assertThatThrownBy(() -> limiter.verificar("10.0.0.7", "outra@sige.local"))
                .isInstanceOf(ApiException.class);
    }
}

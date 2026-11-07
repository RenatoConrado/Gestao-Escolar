package br.edu.sige.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import br.edu.sige.common.ApiException;

/**
 * Limitador de tentativas de autenticação em memória (sem dependências externas, adequado a uma única instância).
 * Conta FALHAS em janela fixa por (origem + conta) e por origem. Chave composta evita que um atacante bloqueie a
 * conta de terceiros a partir de outro IP. Reiniciar a aplicação zera os contadores (aceitável no protótipo).
 */
@Component
public class LoginRateLimiter {

    private static final int LIMPEZA_ACIMA_DE = 10_000;

    private record Contador(Instant inicio, int falhas) {
    }

    private final Map<String, Contador> contadores = new ConcurrentHashMap<>();
    private final LoginLimitProperties props;
    private final Clock clock;

    public LoginRateLimiter(LoginLimitProperties props, Clock clock) {
        this.props = props;
        this.clock = clock;
    }

    /** Lança 429 (com Retry-After) se a conta ou a origem estiver bloqueada na janela atual. */
    public void verificar(String origem, String conta) {
        exigirDentroDoLimite(chaveConta(origem, conta), props.maxPorConta());
        exigirDentroDoLimite(chaveOrigem(origem), props.maxPorOrigem());
    }

    public void registrarFalha(String origem, String conta) {
        incrementar(chaveConta(origem, conta));
        incrementar(chaveOrigem(origem));
        if (contadores.size() > LIMPEZA_ACIMA_DE) {
            Instant agora = clock.instant();
            contadores.entrySet().removeIf(e -> expirou(e.getValue(), agora));
        }
    }

    /** Sucesso zera apenas o contador da conta (o da origem continua contando). */
    public void registrarSucesso(String origem, String conta) {
        contadores.remove(chaveConta(origem, conta));
    }

    private void exigirDentroDoLimite(String chave, int maximo) {
        Contador c = contadores.get(chave);
        if (c == null) {
            return;
        }
        Instant agora = clock.instant();
        if (expirou(c, agora)) {
            contadores.remove(chave, c);
            return;
        }
        if (c.falhas() >= maximo) {
            long segundos = Duration.between(agora, c.inicio().plus(props.janela())).toSeconds() + 1;
            throw ApiException.muitasRequisicoes("Muitas tentativas. Aguarde alguns minutos e tente novamente.", segundos);
        }
    }

    private void incrementar(String chave) {
        Instant agora = clock.instant();
        contadores.merge(chave, new Contador(agora, 1),
                (atual, novo) -> expirou(atual, agora) ? novo : new Contador(atual.inicio(), atual.falhas() + 1));
    }

    private boolean expirou(Contador c, Instant agora) {
        return !agora.isBefore(c.inicio().plus(props.janela()));
    }

    private String chaveConta(String origem, String conta) {
        return "c|" + origem + "|" + conta;
    }

    private String chaveOrigem(String origem) {
        return "o|" + origem;
    }
}

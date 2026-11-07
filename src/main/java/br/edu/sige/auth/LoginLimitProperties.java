package br.edu.sige.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.login-limit")
public record LoginLimitProperties(
        @DefaultValue("5") int maxPorConta,
        @DefaultValue("30") int maxPorOrigem,
        @DefaultValue("10m") Duration janela) {
}

package br.edu.sige.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.bootstrap")
public record BootstrapProperties(String adminNome, String adminEmail, String adminSenha) {
}

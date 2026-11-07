package br.edu.sige.common;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {

    /** Relógio injetável: permite testar regras dependentes de tempo (ex.: janela do limitador de login). */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}

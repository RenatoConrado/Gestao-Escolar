package br.edu.sige.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

/**
 * Documentação OpenAPI. A UI fica em /swagger-ui.html e o JSON em /v3/api-docs, mas SOMENTE quando
 * SWAGGER_ENABLED=true (desligado por padrão, para não expor o mapa da API em produção).
 * Use "Authorize" com o token obtido em POST /api/auth/login (sem o prefixo "Bearer").
 */
@Configuration
public class OpenApiConfig {

    private static final String ESQUEMA = "bearerAuth";

    @Bean
    OpenAPI sigeOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("SIGE API")
                        .version("0.1.0")
                        .description("Sistema de Informação Gerencial para redes municipais de ensino. "
                                + "Perfis: ADMIN, SECRETARIO, PROFESSOR, LEITOR."))
                .components(new Components().addSecuritySchemes(ESQUEMA, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(ESQUEMA));
    }
}

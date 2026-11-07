package br.edu.sige;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SigeApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SigeApiApplication.class, args);
    }
}

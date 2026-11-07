package br.edu.sige.anoletivo;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AnoLetivoRepository extends JpaRepository<AnoLetivo, Long> {

    boolean existsByAno(int ano);

    boolean existsByAnoAndIdNot(int ano, Long id);
}

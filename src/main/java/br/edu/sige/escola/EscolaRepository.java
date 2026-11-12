package br.edu.sige.escola;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EscolaRepository extends JpaRepository<Escola, Long> {

    boolean existsByCodigo(String codigo);

    boolean existsByCodigoAndIdNot(String codigo, Long id);

    boolean existsByDiretorId(Long diretorId);

    List<Escola> findByDiretorId(Long diretorId);
}

package br.edu.sige.professor;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfessorRepository extends JpaRepository<Professor, Long> {

    @EntityGraph(attributePaths = "escola")
    Page<Professor> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "escola")
    Page<Professor> findByEscolaId(Long escolaId, Pageable pageable);

    @EntityGraph(attributePaths = "escola")
    Optional<Professor> findComEscolaById(Long id);

    long countByEscolaId(Long escolaId);

    boolean existsByMatricula(String matricula);

    boolean existsByMatriculaAndIdNot(String matricula, Long id);

    boolean existsByCpf(String cpf);

    boolean existsByCpfAndIdNot(String cpf, Long id);

    boolean existsByUsuarioId(Long usuarioId);

    boolean existsByUsuarioIdAndIdNot(Long usuarioId, Long id);
}

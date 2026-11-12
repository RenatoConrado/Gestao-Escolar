package br.edu.sige.usuario;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    @EntityGraph(attributePaths = {"perfil", "escola"})
    Optional<Usuario> findByEmail(String email);

    @EntityGraph(attributePaths = {"perfil", "escola"})
    Optional<Usuario> findComPerfilById(Long id);

    @EntityGraph(attributePaths = {"perfil", "escola"})
    Page<Usuario> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"perfil", "escola"})
    Page<Usuario> findByEscolaId(Long escolaId, Pageable pageable);

    @Query("select u.ativo as ativo, u.versaoToken as versaoToken from Usuario u where u.id = :id")
    Optional<UsuarioStatusToken> findStatusById(@Param("id") Long id);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);
}

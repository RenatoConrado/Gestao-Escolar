package br.edu.sige.aluno;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {

    Page<Aluno> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    @Query("""
            select a from Aluno a
            where (:nome is null or lower(a.nome) like lower(concat('%', :nome, '%')))
              and (
                  exists (select 1 from Matricula m where m.aluno = a and m.turma.escola.id = :escolaId)
                  or (
                      not exists (select 1 from Matricula m where m.aluno = a)
                      and exists (select 1 from Usuario u where u.id = a.criadoPor and u.escola.id = :escolaId)
                  )
              )
            """)
    Page<Aluno> findPorEscola(@Param("escolaId") Long escolaId, @Param("nome") String nome, Pageable pageable);

    @Query("""
            select a from Aluno a
            where (:nome is null or lower(a.nome) like lower(concat('%', :nome, '%')))
              and exists (
                  select 1 from Matricula m
                  where m.aluno = a
                    and m.situacao = br.edu.sige.matricula.SituacaoMatricula.ATIVA
                    and exists (
                        select 1 from AtribuicaoDocente ad
                        where ad.turma = m.turma
                          and ad.ativo = true
                          and ad.professor.usuario.id = :usuarioId
                    )
              )
            """)
    Page<Aluno> findDoProfessor(@Param("usuarioId") Long usuarioId, @Param("nome") String nome, Pageable pageable);

    @Query("""
            select case when count(a) > 0 then true else false end from Aluno a
            where a.id = :alunoId
              and (
                  exists (select 1 from Matricula m where m.aluno = a and m.turma.escola.id = :escolaId)
                  or (
                      not exists (select 1 from Matricula m where m.aluno = a)
                      and exists (select 1 from Usuario u where u.id = a.criadoPor and u.escola.id = :escolaId)
                  )
              )
            """)
    boolean pertenceAEscola(@Param("alunoId") Long alunoId, @Param("escolaId") Long escolaId);

    @Query("""
            select case when count(a) > 0 then true else false end from Aluno a
            where a.id = :alunoId
              and exists (
                  select 1 from Matricula m
                  where m.aluno = a
                    and m.situacao = br.edu.sige.matricula.SituacaoMatricula.ATIVA
                    and exists (
                        select 1 from AtribuicaoDocente ad
                        where ad.turma = m.turma
                          and ad.ativo = true
                          and ad.professor.usuario.id = :usuarioId
                    )
              )
            """)
    boolean pertenceAoProfessor(@Param("alunoId") Long alunoId, @Param("usuarioId") Long usuarioId);

    boolean existsByMatricula(String matricula);

    boolean existsByMatriculaAndIdNot(String matricula, Long id);

    boolean existsByCpf(String cpf);

    boolean existsByCpfAndIdNot(String cpf, Long id);
}

package br.edu.sige.auditoria;

import java.time.Instant;
import java.util.ArrayList;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.Predicate;

public class EventoAuditoriaRepositoryImpl implements EventoAuditoriaRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<EventoAuditoria> filtrar(String entidade, Long entidadeId, String perfil,
                                         Instant inicio, Instant fimExclusivo, Pageable pageable) {
        var builder = entityManager.getCriteriaBuilder();
        var query = builder.createQuery(EventoAuditoria.class);
        var evento = query.from(EventoAuditoria.class);
        var filtros = new ArrayList<Predicate>();

        if (entidade != null) {
            filtros.add(builder.equal(evento.get("entidade"), entidade));
        }
        if (entidadeId != null) {
            filtros.add(builder.equal(evento.get("entidadeId"), entidadeId));
        }
        if (perfil != null) {
            filtros.add(builder.equal(evento.get("perfil"), perfil));
        }
        if (inicio != null) {
            filtros.add(builder.greaterThanOrEqualTo(evento.<Instant>get("em"), inicio));
        }
        if (fimExclusivo != null) {
            filtros.add(builder.lessThan(evento.<Instant>get("em"), fimExclusivo));
        }

        query.select(evento).where(filtros.toArray(Predicate[]::new));
        if (pageable.getSort().isSorted()) {
            query.orderBy(pageable.getSort().stream().map(order -> order.isAscending()
                    ? builder.asc(evento.get(order.getProperty()))
                    : builder.desc(evento.get(order.getProperty()))).toList());
        }

        var resultado = entityManager.createQuery(query);
        if (pageable.isPaged()) {
            resultado.setFirstResult(Math.toIntExact(pageable.getOffset()));
            resultado.setMaxResults(pageable.getPageSize());
        }
        var eventos = resultado.getResultList();

        var countQuery = builder.createQuery(Long.class);
        var countRoot = countQuery.from(EventoAuditoria.class);
        var countFiltros = new ArrayList<Predicate>();
        if (entidade != null) {
            countFiltros.add(builder.equal(countRoot.get("entidade"), entidade));
        }
        if (entidadeId != null) {
            countFiltros.add(builder.equal(countRoot.get("entidadeId"), entidadeId));
        }
        if (perfil != null) {
            countFiltros.add(builder.equal(countRoot.get("perfil"), perfil));
        }
        if (inicio != null) {
            countFiltros.add(builder.greaterThanOrEqualTo(countRoot.<Instant>get("em"), inicio));
        }
        if (fimExclusivo != null) {
            countFiltros.add(builder.lessThan(countRoot.<Instant>get("em"), fimExclusivo));
        }
        countQuery.select(builder.count(countRoot)).where(countFiltros.toArray(Predicate[]::new));
        long total = entityManager.createQuery(countQuery).getSingleResult();
        return new PageImpl<>(eventos, pageable, total);
    }
}

package br.edu.sige.security;

/** Dados do usuário extraídos do JWT (sem consulta ao banco). */
public record UsuarioAutenticado(Long id, String email, PerfilNome perfil, Long escolaId) {
}

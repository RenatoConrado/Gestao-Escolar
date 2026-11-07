package br.edu.sige.usuario;

/** Nunca expõe o hash da senha. */
public record UsuarioResponse(Long id, String nome, String email, String perfil, Long escolaId, boolean ativo) {

    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getPerfil().getNome(),
                u.getEscola() == null ? null : u.getEscola().getId(), u.isAtivo());
    }
}

package br.edu.sige.professor;

public record ProfessorResponse(Long id, String matricula, String nome, String cpf, String email, String telefone,
                                String formacao, Long escolaId, Long usuarioId) {

    public static ProfessorResponse from(Professor p, boolean exibirCpf) {
        return new ProfessorResponse(p.getId(), p.getMatricula(), p.getNome(), exibirCpf ? p.getCpf() : null,
                p.getEmail(), p.getTelefone(), p.getFormacao(), p.getEscola().getId(),
                p.getUsuario() == null ? null : p.getUsuario().getId());
    }
}

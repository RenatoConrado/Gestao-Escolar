package br.edu.sige.acesso;

import java.util.Objects;

import org.springframework.stereotype.Service;

import br.edu.sige.atribuicao.AtribuicaoDocente;
import br.edu.sige.atribuicao.AtribuicaoDocenteRepository;
import br.edu.sige.common.ApiException;
import br.edu.sige.security.ContextoSeguranca;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.UsuarioAutenticado;
import br.edu.sige.turma.Turma;
import lombok.RequiredArgsConstructor;

/**
 * Política de ESCOPO de dados (o "quem pode o quê" por perfil está nas anotações @PreAuthorize).
 * <ul>
 *   <li>ADMIN: sem restrição.</li>
 *   <li>SECRETARIO: restrito à sua escola (leitura e escrita).</li>
 *   <li>LEITOR: leitura; restrito à escola somente se o usuário tiver escola vinculada.</li>
 *   <li>PROFESSOR: apenas turmas/atribuições com atribuição docente ATIVA em seu nome.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class AcessoService {

    private final ContextoSeguranca contexto;
    private final AtribuicaoDocenteRepository atribuicoes;

    public UsuarioAutenticado usuario() {
        return contexto.atual();
    }

    /** CPF e demais dados pessoais sensíveis (LGPD) só para ADMIN e SECRETARIO. */
    public boolean podeVerDadosPessoais() {
        PerfilNome p = usuario().perfil();
        return p == PerfilNome.ADMIN || p == PerfilNome.SECRETARIO;
    }

    /** Escola à qual o usuário está restrito, ou {@code null} quando não há restrição por escola. */
    public Long escolaRestrita() {
        UsuarioAutenticado u = usuario();
        if (u.perfil() == PerfilNome.SECRETARIO && u.escolaId() == null) {
            throw ApiException.proibido("Usuário sem unidade escolar vinculada. Procure a administração do sistema.");
        }
        return (u.perfil() == PerfilNome.SECRETARIO || u.perfil() == PerfilNome.LEITOR) ? u.escolaId() : null;
    }

    /** Escrita em cadastros por escola: o SECRETARIO só opera na sua própria escola. */
    public void exigirEscolaDoSecretario(Long escolaId) {
        if (usuario().perfil() == PerfilNome.SECRETARIO && !Objects.equals(escolaRestrita(), escolaId)) {
            throw foraDoEscopo();
        }
    }

    public void exigirLeituraDaTurma(Turma turma) {
        UsuarioAutenticado u = usuario();
        switch (u.perfil()) {
            case ADMIN -> { }
            case SECRETARIO, LEITOR -> exigirMesmaEscola(turma.getEscola().getId());
            case PROFESSOR -> {
                if (!atribuicoes.existsByProfessorUsuarioIdAndTurmaIdAndAtivoTrue(u.id(), turma.getId())) {
                    throw foraDoEscopo();
                }
            }
        }
    }

    public void exigirLeituraDaAtribuicao(AtribuicaoDocente atribuicao) {
        UsuarioAutenticado u = usuario();
        if (u.perfil() == PerfilNome.PROFESSOR) {
            if (!atribuicoes.existsByIdAndProfessorUsuarioIdAndAtivoTrue(atribuicao.getId(), u.id())) {
                throw foraDoEscopo();
            }
        } else {
            exigirLeituraDaTurma(atribuicao.getTurma());
        }
    }

    /** Escrita de frequência (nível de turma). */
    public void exigirEscritaNaTurma(Turma turma) {
        UsuarioAutenticado u = usuario();
        switch (u.perfil()) {
            case ADMIN -> { }
            case SECRETARIO -> exigirMesmaEscola(turma.getEscola().getId());
            case PROFESSOR -> {
                if (!atribuicoes.existsByProfessorUsuarioIdAndTurmaIdAndAtivoTrue(u.id(), turma.getId())) {
                    throw foraDoEscopo();
                }
            }
            case LEITOR -> throw ApiException.proibido("O perfil LEITOR é somente leitura.");
        }
    }

    /** Escrita de avaliações e notas (nível de atribuição: turma + disciplina). */
    public void exigirEscritaNaAtribuicao(AtribuicaoDocente atribuicao) {
        UsuarioAutenticado u = usuario();
        switch (u.perfil()) {
            case ADMIN -> { }
            case SECRETARIO -> exigirMesmaEscola(atribuicao.getTurma().getEscola().getId());
            case PROFESSOR -> {
                if (!atribuicoes.existsByIdAndProfessorUsuarioIdAndAtivoTrue(atribuicao.getId(), u.id())) {
                    throw foraDoEscopo();
                }
            }
            case LEITOR -> throw ApiException.proibido("O perfil LEITOR é somente leitura.");
        }
    }

    private void exigirMesmaEscola(Long escolaId) {
        Long restrita = escolaRestrita();
        if (restrita != null && !restrita.equals(escolaId)) {
            throw foraDoEscopo();
        }
    }

    private ApiException foraDoEscopo() {
        return ApiException.proibido("Acesso negado: o recurso está fora do seu escopo (escola ou atribuição docente).");
    }
}

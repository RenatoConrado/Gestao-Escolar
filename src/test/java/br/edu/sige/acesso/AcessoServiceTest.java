package br.edu.sige.acesso;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import br.edu.sige.atribuicao.AtribuicaoDocente;
import br.edu.sige.atribuicao.AtribuicaoDocenteRepository;
import br.edu.sige.common.ApiException;
import br.edu.sige.escola.Escola;
import br.edu.sige.security.ContextoSeguranca;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.UsuarioAutenticado;
import br.edu.sige.turma.Turma;

class AcessoServiceTest {

    private final ContextoSeguranca contexto = mock(ContextoSeguranca.class);
    private final AtribuicaoDocenteRepository atribuicoes = mock(AtribuicaoDocenteRepository.class);
    private final AcessoService acesso = new AcessoService(contexto, atribuicoes);

    private Turma turma(Long id, Long escolaId) {
        Escola escola = new Escola();
        ReflectionTestUtils.setField(escola, "id", escolaId);
        Turma turma = new Turma();
        ReflectionTestUtils.setField(turma, "id", id);
        turma.setEscola(escola);
        return turma;
    }

    private void logadoComo(PerfilNome perfil, Long usuarioId, Long escolaId) {
        when(contexto.atual()).thenReturn(new UsuarioAutenticado(usuarioId, "u@sige.local", perfil, escolaId));
    }

    @Test
    void professorComAtribuicaoAtivaPodeEscreverNaTurma() {
        logadoComo(PerfilNome.PROFESSOR, 10L, null);
        when(atribuicoes.existsByProfessorUsuarioIdAndTurmaIdAndAtivoTrue(10L, 1L)).thenReturn(true);

        assertThatCode(() -> acesso.exigirEscritaNaTurma(turma(1L, 5L))).doesNotThrowAnyException();
    }

    @Test
    void professorSemAtribuicaoRecebe403AoEscreverNaTurma() {
        logadoComo(PerfilNome.PROFESSOR, 10L, null);
        when(atribuicoes.existsByProfessorUsuarioIdAndTurmaIdAndAtivoTrue(10L, 1L)).thenReturn(false);

        assertThatThrownBy(() -> acesso.exigirEscritaNaTurma(turma(1L, 5L)))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void secretarioNaoEscreveEmTurmaDeOutraEscola() {
        logadoComo(PerfilNome.SECRETARIO, 20L, 5L);

        assertThatThrownBy(() -> acesso.exigirEscritaNaTurma(turma(1L, 6L))).isInstanceOf(ApiException.class);
        assertThatCode(() -> acesso.exigirEscritaNaTurma(turma(1L, 5L))).doesNotThrowAnyException();
    }

    @Test
    void secretarioSemEscolaVinculadaEBloqueado() {
        logadoComo(PerfilNome.SECRETARIO, 20L, null);

        assertThatThrownBy(() -> acesso.escolaRestrita()).isInstanceOf(ApiException.class);
    }

    @Test
    void leitorNuncaEscreve() {
        logadoComo(PerfilNome.LEITOR, 30L, null);

        assertThatThrownBy(() -> acesso.exigirEscritaNaTurma(turma(1L, 5L))).isInstanceOf(ApiException.class);
    }

    @Test
    void leitorSemEscolaLeTodaARede() {
        logadoComo(PerfilNome.LEITOR, 30L, null);

        assertThat(acesso.escolaRestrita()).isNull();
        assertThatCode(() -> acesso.exigirLeituraDaTurma(turma(1L, 99L))).doesNotThrowAnyException();
    }

    @Test
    void apenasAdminESecretarioVeemDadosPessoais() {
        logadoComo(PerfilNome.PROFESSOR, 10L, null);
        assertThat(acesso.podeVerDadosPessoais()).isFalse();

        logadoComo(PerfilNome.ADMIN, 1L, null);
        assertThat(acesso.podeVerDadosPessoais()).isTrue();
    }

    @Test
    void adminOuSecretarioNaoPodemEscreverEmAtribuicaoInativa() {
        AtribuicaoDocente inativa = new AtribuicaoDocente();
        ReflectionTestUtils.setField(inativa, "id", 77L);
        inativa.setTurma(turma(1L, 5L));
        inativa.setAtivo(false);

        logadoComo(PerfilNome.ADMIN, 1L, null);
        assertThatThrownBy(() -> acesso.exigirEscritaNaAtribuicao(inativa))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));

        logadoComo(PerfilNome.SECRETARIO, 20L, 5L);
        assertThatThrownBy(() -> acesso.exigirEscritaNaAtribuicao(inativa))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));
    }
}

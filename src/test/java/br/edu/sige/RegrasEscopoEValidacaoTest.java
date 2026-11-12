package br.edu.sige;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.aluno.Aluno;
import br.edu.sige.aluno.AlunoRepository;
import br.edu.sige.aluno.AlunoResponse;
import br.edu.sige.aluno.AlunoService;
import br.edu.sige.anoletivo.AnoLetivo;
import br.edu.sige.atribuicao.AtribuicaoDocente;
import br.edu.sige.atribuicao.AtribuicaoDocenteRepository;
import br.edu.sige.auditoria.AuditoriaService;
import br.edu.sige.avaliacao.Avaliacao;
import br.edu.sige.avaliacao.AvaliacaoRepository;
import br.edu.sige.avaliacao.AvaliacaoRequest;
import br.edu.sige.avaliacao.AvaliacaoService;
import br.edu.sige.common.ApiException;
import br.edu.sige.escola.Escola;
import br.edu.sige.escola.EscolaRepository;
import br.edu.sige.frequencia.FrequenciaRepository;
import br.edu.sige.frequencia.FrequenciaRequest;
import br.edu.sige.frequencia.FrequenciaService;
import br.edu.sige.matricula.MatriculaRepository;
import br.edu.sige.nota.NotaRepository;
import br.edu.sige.nota.NotaRequest;
import br.edu.sige.nota.NotaService;
import br.edu.sige.professor.Professor;
import br.edu.sige.professor.ProfessorRepository;
import br.edu.sige.professor.ProfessorRequest;
import br.edu.sige.professor.ProfessorService;
import br.edu.sige.security.ContextoSeguranca;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.UsuarioAutenticado;
import br.edu.sige.turma.Turma;
import br.edu.sige.turma.TurmaRepository;
import br.edu.sige.usuario.Perfil;
import br.edu.sige.usuario.PerfilRepository;
import br.edu.sige.usuario.Usuario;
import br.edu.sige.usuario.UsuarioRepository;
import br.edu.sige.usuario.UsuarioService;

class RegrasEscopoEValidacaoTest {

    @Test
    void b1_secretarioListaEBuscaApenasUsuariosDaSuaEscola() {
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        PerfilRepository perfis = mock(PerfilRepository.class);
        EscolaRepository escolas = mock(EscolaRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ContextoSeguranca contexto = mock(ContextoSeguranca.class);
        AcessoService acesso = mock(AcessoService.class);
        AuditoriaService auditoria = mock(AuditoriaService.class);

        UsuarioService service = new UsuarioService(usuarios, perfis, escolas, encoder, contexto, acesso, auditoria);

        when(acesso.escolaRestrita()).thenReturn(10L);
        when(usuarios.findByEscolaId(10L, Pageable.unpaged())).thenReturn(new PageImpl<>(List.of()));

        service.listar(Pageable.unpaged());
        verify(usuarios).findByEscolaId(10L, Pageable.unpaged());

        Perfil perfil = new Perfil();
        perfil.setNome("ADMIN");
        Usuario adminSemEscola = new Usuario();
        ReflectionTestUtils.setField(adminSemEscola, "id", 1L);
        adminSemEscola.setNome("Admin");
        adminSemEscola.setEmail("admin@sige.local");
        adminSemEscola.setPerfil(perfil);
        when(usuarios.findComPerfilById(1L)).thenReturn(Optional.of(adminSemEscola));

        assertThatThrownBy(() -> service.buscar(1L))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void b2_alunoServiceRespeitaEscopoDeEscolaEProfessor() {
        AlunoRepository alunos = mock(AlunoRepository.class);
        AcessoService acesso = mock(AcessoService.class);
        AlunoService service = new AlunoService(alunos, acesso);

        Aluno a = new Aluno();
        ReflectionTestUtils.setField(a, "id", 50L);
        a.setMatricula("2025001");
        a.setNome("Maria");
        a.setDataNascimento(LocalDate.of(2012, 5, 10));
        a.setCpf("12345678901");
        a.setEndereco("Rua A, 10");
        a.setTelefone("11999999999");
        a.setResponsavel("João");
        when(alunos.findById(50L)).thenReturn(Optional.of(a));

        // SECRETARIO de outra escola (escolaId = 2) bloqueado ao excluir aluno de escola 1
        when(acesso.usuario()).thenReturn(new UsuarioAutenticado(20L, "sec@sige.local", PerfilNome.SECRETARIO, 2L));
        when(acesso.escolaRestrita()).thenReturn(2L);
        when(alunos.pertenceAEscola(50L, 2L)).thenReturn(false);

        assertThatThrownBy(() -> service.excluir(50L))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        // PROFESSOR com aluno em sua turma ativa: oculta CPF, endereço e telefone
        when(acesso.usuario()).thenReturn(new UsuarioAutenticado(30L, "prof@sige.local", PerfilNome.PROFESSOR, 1L));
        when(acesso.podeVerDadosPessoais()).thenReturn(false);
        when(alunos.pertenceAoProfessor(50L, 30L)).thenReturn(true);

        AlunoResponse resp = service.buscar(50L);
        assertThat(resp.cpf()).isNull();
        assertThat(resp.endereco()).isNull();
        assertThat(resp.telefone()).isNull();
    }

    @Test
    void b3_atualizarEscolaDoProfessorDesvinculaDiretorDaEscolaAnterior() {
        ProfessorRepository professores = mock(ProfessorRepository.class);
        EscolaRepository escolas = mock(EscolaRepository.class);
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        AcessoService acesso = mock(AcessoService.class);

        ProfessorService service = new ProfessorService(professores, escolas, usuarios, acesso);

        Escola escolaAntiga = new Escola();
        ReflectionTestUtils.setField(escolaAntiga, "id", 1L);
        Escola escolaNova = new Escola();
        ReflectionTestUtils.setField(escolaNova, "id", 2L);

        Professor p = new Professor();
        ReflectionTestUtils.setField(p, "id", 10L);
        p.setEscola(escolaAntiga);
        escolaAntiga.setDiretor(p);

        when(professores.findComEscolaById(10L)).thenReturn(Optional.of(p));
        when(escolas.findById(2L)).thenReturn(Optional.of(escolaNova));
        when(escolas.findByDiretorId(10L)).thenReturn(List.of(escolaAntiga));

        ProfessorRequest req = new ProfessorRequest(
                "PROF-10", "Carlos", "12345678901", "carlos@sige.local", "11999999999", "Pedagogia", 2L, null);

        service.atualizar(10L, req);

        assertThat(escolaAntiga.getDiretor()).isNull();
        assertThat(p.getEscola()).isSameAs(escolaNova);
    }

    @Test
    void b5_b6_avaliacaoFrequenciaENotaValidamPeriodoDoAnoLetivoEAtribuicaoAtiva() {
        AvaliacaoRepository avaliacoes = mock(AvaliacaoRepository.class);
        AtribuicaoDocenteRepository atribuicoes = mock(AtribuicaoDocenteRepository.class);
        TurmaRepository turmas = mock(TurmaRepository.class);
        NotaRepository notas = mock(NotaRepository.class);
        AcessoService acesso = mock(AcessoService.class);
        AuditoriaService auditoria = mock(AuditoriaService.class);
        FrequenciaRepository frequencias = mock(FrequenciaRepository.class);
        AlunoRepository alunos = mock(AlunoRepository.class);
        MatriculaRepository matriculas = mock(MatriculaRepository.class);

        AvaliacaoService avaliacaoService = new AvaliacaoService(avaliacoes, atribuicoes, turmas, notas, acesso, auditoria);
        FrequenciaService frequenciaService = new FrequenciaService(frequencias, turmas, alunos, matriculas, acesso, auditoria);
        NotaService notaService = new NotaService(notas, avaliacoes, alunos, turmas, matriculas, acesso, auditoria);

        AnoLetivo ano = new AnoLetivo();
        ano.setAno(2025);
        ano.setDataInicio(LocalDate.of(2025, 2, 1));
        ano.setDataFim(LocalDate.of(2025, 12, 15));

        Turma turma = new Turma();
        ReflectionTestUtils.setField(turma, "id", 5L);
        turma.setAnoLetivo(ano);
        when(turmas.findComEscolaById(5L)).thenReturn(Optional.of(turma));

        AtribuicaoDocente atribuicao = new AtribuicaoDocente();
        ReflectionTestUtils.setField(atribuicao, "id", 10L);
        atribuicao.setTurma(turma);
        atribuicao.setAnoLetivo(ano);
        atribuicao.setAtivo(true);
        when(atribuicoes.findComDetalhesById(10L)).thenReturn(Optional.of(atribuicao));

        // B5: Avaliação fora do intervalo do ano letivo
        AvaliacaoRequest reqForaDoAno = new AvaliacaoRequest(
                10L, "Prova 1", LocalDate.of(2025, 1, 15), new BigDecimal("10.00"));
        assertThatThrownBy(() -> avaliacaoService.criar(reqForaDoAno))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));

        // B5: Frequência antes do início do ano letivo
        FrequenciaRequest freqForaDoAno = new FrequenciaRequest(
                1L, 5L, LocalDate.of(2025, 1, 10), true, null);
        assertThatThrownBy(() -> frequenciaService.registrar(freqForaDoAno))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));

        // B6: Lançar nota ou atualizar avaliação em atribuição inativa (mesmo como ADMIN)
        atribuicao.setAtivo(false);
        Avaliacao av = new Avaliacao();
        ReflectionTestUtils.setField(av, "id", 99L);
        av.setAtribuicao(atribuicao);
        av.setValorMaximo(new BigDecimal("10.00"));
        when(avaliacoes.findComAtribuicaoById(99L)).thenReturn(Optional.of(av));

        NotaRequest notaReq = new NotaRequest(1L, 99L, new BigDecimal("8.50"));
        assertThatThrownBy(() -> notaService.lancar(notaReq))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));

        AvaliacaoRequest updateAvReq = new AvaliacaoRequest(
                10L, "Prova Editada", LocalDate.of(2025, 3, 10), new BigDecimal("10.00"));
        assertThatThrownBy(() -> avaliacaoService.atualizar(99L, updateAvReq))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));
    }
}


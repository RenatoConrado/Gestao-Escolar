package br.edu.sige.relatorio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.aluno.Aluno;
import br.edu.sige.aluno.AlunoRepository;
import br.edu.sige.anoletivo.AnoLetivo;
import br.edu.sige.atribuicao.AtribuicaoDocente;
import br.edu.sige.atribuicao.AtribuicaoDocenteRepository;
import br.edu.sige.avaliacao.Avaliacao;
import br.edu.sige.avaliacao.AvaliacaoRepository;
import br.edu.sige.common.ApiException;
import br.edu.sige.escola.Escola;
import br.edu.sige.escola.EscolaRepository;
import br.edu.sige.frequencia.FrequenciaRepository;
import br.edu.sige.frequencia.ResumoFrequenciaAluno;
import br.edu.sige.matricula.Matricula;
import br.edu.sige.matricula.MatriculaRepository;
import br.edu.sige.matricula.SituacaoMatricula;
import br.edu.sige.nota.Nota;
import br.edu.sige.nota.NotaRepository;
import br.edu.sige.professor.Professor;
import br.edu.sige.professor.ProfessorRepository;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.UsuarioAutenticado;
import br.edu.sige.turma.Turma;
import br.edu.sige.turma.TurmaRepository;
import br.edu.sige.usuario.Usuario;

class RelatorioServiceTest {

    private final MatriculaRepository matriculas = mock(MatriculaRepository.class);
    private final TurmaRepository turmas = mock(TurmaRepository.class);
    private final ProfessorRepository professores = mock(ProfessorRepository.class);
    private final EscolaRepository escolas = mock(EscolaRepository.class);
    private final AtribuicaoDocenteRepository atribuicoes = mock(AtribuicaoDocenteRepository.class);
    private final FrequenciaRepository frequencias = mock(FrequenciaRepository.class);
    private final AcessoService acesso = mock(AcessoService.class);
    private final AlunoRepository alunos = mock(AlunoRepository.class);
    private final AvaliacaoRepository avaliacoes = mock(AvaliacaoRepository.class);
    private final NotaRepository notas = mock(NotaRepository.class);

    private final RelatorioService service = new RelatorioService(
            matriculas, turmas, professores, escolas, atribuicoes, frequencias,
            acesso, alunos, avaliacoes, notas);

    @Test
    void boletimUsaMatriculaAtivaMaisRecenteECalculaMediaEFrequencia() {
        Aluno aluno = aluno(10L, "A-10", "Ana");
        AnoLetivo anoAnterior = anoLetivo(2024);
        AnoLetivo anoAtual = anoLetivo(2025);
        Turma turmaAntiga = turma(20L, "Turma antiga", escola("Escola"));
        Turma turmaAtual = turma(21L, "Turma atual", escola("Escola"));
        Matricula matriculaAntiga = matricula(30L, aluno, turmaAntiga, anoAnterior);
        Matricula matriculaAtual = matricula(31L, aluno, turmaAtual, anoAtual);

        when(alunos.findById(10L)).thenReturn(Optional.of(aluno));
        when(matriculas.findByAlunoIdAndSituacao(10L, SituacaoMatricula.ATIVA))
                .thenReturn(List.of(matriculaAntiga, matriculaAtual));

        ResumoFrequenciaAluno resumo = mock(ResumoFrequenciaAluno.class);
        when(resumo.getTotal()).thenReturn(3L);
        when(resumo.getPresencas()).thenReturn(2L);
        when(frequencias.resumirPorAlunoETurma(10L, 21L)).thenReturn(Optional.of(resumo));

        var disciplina = new br.edu.sige.disciplina.Disciplina();
        disciplina.setNome("Matemática");
        ReflectionTestUtils.setField(disciplina, "id", 40L);
        AtribuicaoDocente atribuicao = new AtribuicaoDocente();
        ReflectionTestUtils.setField(atribuicao, "id", 50L);
        atribuicao.setDisciplina(disciplina);

        Avaliacao primeira = avaliacao(60L, atribuicao, "Prova 1", "2025-03-10");
        Avaliacao segunda = avaliacao(61L, atribuicao, "Prova 2", "2025-04-10");
        when(atribuicoes.findByTurmaIdAndAnoLetivoIdAndAtivoTrue(21L, 2025L))
                .thenReturn(List.of(atribuicao));
        when(avaliacoes.findByAtribuicaoIdInOrderByDataAsc(List.of(50L)))
                .thenReturn(List.of(primeira, segunda));
        when(notas.findByAlunoIdAndAvaliacaoAtribuicaoIdIn(10L, List.of(50L)))
                .thenReturn(List.of(nota(primeira, "8.00"), nota(segunda, "6.00")));

        BoletimAlunoResponse boletim = service.boletimDoAluno(10L);

        assertThat(boletim.alunoNome()).isEqualTo("Ana");
        assertThat(boletim.matriculaId()).isEqualTo(31L);
        assertThat(boletim.turmaNome()).isEqualTo("Turma atual");
        assertThat(boletim.anoLetivo()).isEqualTo(2025);
        assertThat(boletim.frequencia().totalRegistros()).isEqualTo(3);
        assertThat(boletim.frequencia().presencas()).isEqualTo(2);
        assertThat(boletim.frequencia().faltas()).isEqualTo(1);
        assertThat(boletim.frequencia().percentualPresenca()).isEqualByComparingTo("66.7");
        assertThat(boletim.disciplinas()).singleElement().satisfies(item -> {
            assertThat(item.disciplinaNome()).isEqualTo("Matemática");
            assertThat(item.media()).isEqualByComparingTo("7.00");
            assertThat(item.avaliacoes()).hasSize(2);
        });
        verify(acesso).exigirLeituraDaTurma(turmaAtual);
        verify(frequencias).resumirPorAlunoETurma(10L, 21L);
    }

    @Test
    void boletimSemMatriculaAtivaRetorna404() {
        Aluno aluno = aluno(10L, "A-10", "Ana");
        when(alunos.findById(10L)).thenReturn(Optional.of(aluno));
        when(matriculas.findByAlunoIdAndSituacao(10L, SituacaoMatricula.ATIVA)).thenReturn(List.of());

        assertThatThrownBy(() -> service.boletimDoAluno(10L))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        verifyNoInteractions(acesso, frequencias, atribuicoes, avaliacoes, notas);
    }

    @Test
    void relatorioDeFrequenciaIncluiAlunoSemRegistros() {
        Aluno aluno = aluno(10L, "A-10", "Ana");
        Matricula matricula = matricula(30L, aluno, turma(20L, "Turma", escola("Escola")), anoLetivo(2025));
        when(turmas.findComEscolaById(20L)).thenReturn(Optional.of(matricula.getTurma()));
        when(matriculas.findByTurmaIdAndSituacaoOrderByAlunoNomeAsc(20L, SituacaoMatricula.ATIVA))
                .thenReturn(List.of(matricula));
        when(frequencias.resumirPorTurma(20L)).thenReturn(List.of());

        List<FrequenciaAlunoResponse> resultado = service.frequenciaDaTurma(20L);

        assertThat(resultado).containsExactly(new FrequenciaAlunoResponse(
                10L, "Ana", "A-10", 0, 0, 0, BigDecimal.ZERO));
        verify(acesso).exigirLeituraDaTurma(matricula.getTurma());
    }

    @Test
    void boletimNormalizaMediaPeloValorMaximoEAvaliacaoSemNota() {
        Aluno aluno = aluno(10L, "A-10", "Ana");
        AnoLetivo ano = anoLetivo(2025);
        Turma turma = turma(21L, "Turma", escola("Escola"));
        Matricula matricula = matricula(31L, aluno, turma, ano);

        when(alunos.findById(10L)).thenReturn(Optional.of(aluno));
        when(matriculas.findByAlunoIdAndSituacao(10L, SituacaoMatricula.ATIVA)).thenReturn(List.of(matricula));
        when(frequencias.resumirPorAlunoETurma(10L, 21L)).thenReturn(Optional.empty());

        var disciplina = new br.edu.sige.disciplina.Disciplina();
        disciplina.setNome("História");
        ReflectionTestUtils.setField(disciplina, "id", 40L);
        AtribuicaoDocente atribuicao = new AtribuicaoDocente();
        ReflectionTestUtils.setField(atribuicao, "id", 50L);
        atribuicao.setDisciplina(disciplina);

        Avaliacao primeira = avaliacao(60L, atribuicao, "Trabalho", "2025-03-10");
        primeira.setValorMaximo(new BigDecimal("4.00"));
        Avaliacao segunda = avaliacao(61L, atribuicao, "Prova", "2025-04-10");
        segunda.setValorMaximo(new BigDecimal("6.00"));

        when(atribuicoes.findByTurmaIdAndAnoLetivoIdAndAtivoTrue(21L, 2025L)).thenReturn(List.of(atribuicao));
        when(avaliacoes.findByAtribuicaoIdInOrderByDataAsc(List.of(50L))).thenReturn(List.of(primeira, segunda));
        when(notas.findByAlunoIdAndAvaliacaoAtribuicaoIdIn(10L, List.of(50L)))
                .thenReturn(List.of(nota(primeira, "4.00")));

        BoletimAlunoResponse boletim = service.boletimDoAluno(10L);

        assertThat(boletim.disciplinas()).singleElement().satisfies(item -> {
            assertThat(item.media()).isEqualByComparingTo("4.00");
        });
    }

    @Test
    void boletimParaProfessorFiltraApenasDisciplinasDasSuasAtribuicoes() {
        Aluno aluno = aluno(10L, "A-10", "Ana");
        AnoLetivo ano = anoLetivo(2025);
        Turma turma = turma(21L, "Turma", escola("Escola"));
        Matricula matricula = matricula(31L, aluno, turma, ano);

        when(acesso.usuario()).thenReturn(new UsuarioAutenticado(100L, "prof@sige.local", PerfilNome.PROFESSOR, 1L));
        when(alunos.findById(10L)).thenReturn(Optional.of(aluno));
        when(matriculas.findByAlunoIdAndSituacao(10L, SituacaoMatricula.ATIVA)).thenReturn(List.of(matricula));
        when(frequencias.resumirPorAlunoETurma(10L, 21L)).thenReturn(Optional.empty());

        Usuario usuarioProf1 = new Usuario();
        ReflectionTestUtils.setField(usuarioProf1, "id", 100L);
        Professor prof1 = new Professor();
        prof1.setUsuario(usuarioProf1);

        Usuario usuarioProf2 = new Usuario();
        ReflectionTestUtils.setField(usuarioProf2, "id", 200L);
        Professor prof2 = new Professor();
        prof2.setUsuario(usuarioProf2);

        var mat = new br.edu.sige.disciplina.Disciplina();
        mat.setNome("Matemática");
        ReflectionTestUtils.setField(mat, "id", 40L);
        AtribuicaoDocente atribMat = new AtribuicaoDocente();
        ReflectionTestUtils.setField(atribMat, "id", 50L);
        atribMat.setDisciplina(mat);
        atribMat.setProfessor(prof1);

        var port = new br.edu.sige.disciplina.Disciplina();
        port.setNome("Português");
        ReflectionTestUtils.setField(port, "id", 41L);
        AtribuicaoDocente atribPort = new AtribuicaoDocente();
        ReflectionTestUtils.setField(atribPort, "id", 51L);
        atribPort.setDisciplina(port);
        atribPort.setProfessor(prof2);

        when(atribuicoes.findByTurmaIdAndAnoLetivoIdAndAtivoTrue(21L, 2025L))
                .thenReturn(List.of(atribMat, atribPort));
        when(avaliacoes.findByAtribuicaoIdInOrderByDataAsc(List.of(50L))).thenReturn(List.of());
        when(notas.findByAlunoIdAndAvaliacaoAtribuicaoIdIn(10L, List.of(50L))).thenReturn(List.of());

        BoletimAlunoResponse boletim = service.boletimDoAluno(10L);

        assertThat(boletim.disciplinas()).singleElement().satisfies(item -> {
            assertThat(item.disciplinaNome()).isEqualTo("Matemática");
        });
    }

    private static Aluno aluno(Long id, String matricula, String nome) {
        Aluno aluno = new Aluno();
        ReflectionTestUtils.setField(aluno, "id", id);
        aluno.setMatricula(matricula);
        aluno.setNome(nome);
        return aluno;
    }

    private static AnoLetivo anoLetivo(int ano) {
        AnoLetivo anoLetivo = new AnoLetivo();
        anoLetivo.setAno(ano);
        ReflectionTestUtils.setField(anoLetivo, "id", (long) ano);
        return anoLetivo;
    }

    private static Escola escola(String nome) {
        Escola escola = new Escola();
        escola.setNome(nome);
        ReflectionTestUtils.setField(escola, "id", 1L);
        return escola;
    }

    private static Turma turma(Long id, String nome, Escola escola) {
        Turma turma = new Turma();
        ReflectionTestUtils.setField(turma, "id", id);
        turma.setNome(nome);
        turma.setEscola(escola);
        return turma;
    }

    private static Matricula matricula(Long id, Aluno aluno, Turma turma, AnoLetivo anoLetivo) {
        Matricula matricula = new Matricula();
        ReflectionTestUtils.setField(matricula, "id", id);
        matricula.setAluno(aluno);
        matricula.setTurma(turma);
        matricula.setAnoLetivo(anoLetivo);
        matricula.setSituacao(SituacaoMatricula.ATIVA);
        return matricula;
    }

    private static Avaliacao avaliacao(Long id, AtribuicaoDocente atribuicao, String nome, String data) {
        Avaliacao avaliacao = new Avaliacao();
        ReflectionTestUtils.setField(avaliacao, "id", id);
        avaliacao.setAtribuicao(atribuicao);
        avaliacao.setNome(nome);
        avaliacao.setData(LocalDate.parse(data));
        avaliacao.setValorMaximo(new BigDecimal("10.00"));
        return avaliacao;
    }

    private static Nota nota(Avaliacao avaliacao, String valor) {
        Nota nota = new Nota();
        nota.setAvaliacao(avaliacao);
        nota.setValor(new BigDecimal(valor));
        return nota;
    }
}

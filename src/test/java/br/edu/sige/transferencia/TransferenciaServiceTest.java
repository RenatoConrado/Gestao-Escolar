package br.edu.sige.transferencia;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.aluno.Aluno;
import br.edu.sige.aluno.AlunoRepository;
import br.edu.sige.auditoria.AuditoriaService;
import br.edu.sige.anoletivo.AnoLetivo;
import br.edu.sige.escola.Escola;
import br.edu.sige.escola.EscolaRepository;
import br.edu.sige.matricula.Matricula;
import br.edu.sige.matricula.MatriculaRepository;
import br.edu.sige.matricula.SituacaoMatricula;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.UsuarioAutenticado;
import br.edu.sige.turma.Turma;
import br.edu.sige.turma.TurmaRepository;
import br.edu.sige.usuario.Usuario;
import br.edu.sige.usuario.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class TransferenciaServiceTest {

    @Mock private TransferenciaRepository transferencias;
    @Mock private AlunoRepository alunos;
    @Mock private MatriculaRepository matriculas;
    @Mock private EscolaRepository escolas;
    @Mock private TurmaRepository turmas;
    @Mock private UsuarioRepository usuarios;
    @Mock private AcessoService acesso;
    @Mock private AuditoriaService auditoria;
    @InjectMocks private TransferenciaService service;

    @Test
    void liberaMatriculaDeOrigemAntesDeInserirMatriculaDeDestino() {
        Aluno aluno = new Aluno();
        aluno.setNome("Aluno");
        aluno.setMatricula("A-1");

        Escola origemEscola = new Escola();
        ReflectionTestUtils.setField(origemEscola, "id", 10L);
        origemEscola.setNome("Escola de origem");
        Escola destinoEscola = new Escola();
        ReflectionTestUtils.setField(destinoEscola, "id", 20L);
        destinoEscola.setNome("Escola de destino");

        AnoLetivo ano = new AnoLetivo();
        ReflectionTestUtils.setField(ano, "id", 30L);
        ano.setAno(2026);
        Turma turmaOrigem = new Turma();
        turmaOrigem.setEscola(origemEscola);
        turmaOrigem.setAnoLetivo(ano);
        Matricula matriculaOrigem = new Matricula();
        matriculaOrigem.setAluno(aluno);
        matriculaOrigem.setTurma(turmaOrigem);
        matriculaOrigem.setAnoLetivo(ano);
        matriculaOrigem.setSituacao(SituacaoMatricula.ATIVA);

        Turma turmaDestino = new Turma();
        turmaDestino.setNome("Turma destino");
        turmaDestino.setEscola(destinoEscola);
        turmaDestino.setAnoLetivo(ano);

        TransferenciaAluno transferencia = new TransferenciaAluno();
        transferencia.setAluno(aluno);
        transferencia.setMatriculaOrigem(matriculaOrigem);
        transferencia.setEscolaDestino(destinoEscola);
        transferencia.setSituacao(TransferenciaSituacao.PENDENTE);

        when(transferencias.findById(1L)).thenReturn(Optional.of(transferencia));
        when(turmas.findComEscolaById(2L)).thenReturn(Optional.of(turmaDestino));
        when(usuarios.findById(3L)).thenReturn(Optional.of(new Usuario()));
        when(acesso.usuario()).thenReturn(new UsuarioAutenticado(3L, "admin@example.test", PerfilNome.ADMIN, null));

        service.decidir(1L, new DecidirTransferenciaRequest(true, 2L, null));

        InOrder ordem = inOrder(matriculas);
        ordem.verify(matriculas).flush();
        ordem.verify(matriculas).save(any(Matricula.class));
    }
}

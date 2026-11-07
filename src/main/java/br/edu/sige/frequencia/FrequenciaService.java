package br.edu.sige.frequencia;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.aluno.Aluno;
import br.edu.sige.aluno.AlunoRepository;
import br.edu.sige.auditoria.AcaoAuditoria;
import br.edu.sige.auditoria.AuditoriaService;
import br.edu.sige.common.ApiException;
import br.edu.sige.frequencia.FrequenciaLoteRequest.ItemFrequencia;
import br.edu.sige.matricula.MatriculaRepository;
import br.edu.sige.matricula.SituacaoMatricula;
import br.edu.sige.turma.Turma;
import br.edu.sige.turma.TurmaRepository;
import lombok.RequiredArgsConstructor;

/**
 * Diário de classe - frequência. Regra central: o PROFESSOR só registra/consulta frequência de turmas em que
 * possui atribuição docente ATIVA (validado em {@link AcessoService}); o aluno precisa ter matrícula ativa na turma.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FrequenciaService {

    private final FrequenciaRepository frequencias;
    private final TurmaRepository turmas;
    private final AlunoRepository alunos;
    private final MatriculaRepository matriculas;
    private final AcessoService acesso;
    private final AuditoriaService auditoria;

    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
    public Page<FrequenciaResponse> listar(Long turmaId, LocalDate data, Pageable pageable) {
        acesso.exigirLeituraDaTurma(turma(turmaId));
        Page<Frequencia> pagina = data == null
                ? frequencias.findByTurmaId(turmaId, pageable)
                : frequencias.findByTurmaIdAndData(turmaId, data, pageable);
        return pagina.map(FrequenciaResponse::from);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    public FrequenciaResponse registrar(FrequenciaRequest req) {
        Turma turma = turma(req.turmaId());
        acesso.exigirEscritaNaTurma(turma);
        validarData(req.data());
        if (!matriculas.existsByAlunoIdAndTurmaIdAndSituacao(req.alunoId(), turma.getId(), SituacaoMatricula.ATIVA)) {
            throw ApiException.regraDeNegocio("O aluno não possui matrícula ativa nesta turma.");
        }
        if (frequencias.existsByAlunoIdAndTurmaIdAndData(req.alunoId(), turma.getId(), req.data())) {
            throw ApiException.conflito("Frequência já registrada para este aluno nesta data.");
        }
        Aluno aluno = alunos.findById(req.alunoId())
                .orElseThrow(() -> ApiException.naoEncontrado("Aluno", req.alunoId()));
        Frequencia f = new Frequencia();
        f.setAluno(aluno);
        f.setTurma(turma);
        f.setData(req.data());
        f.setPresente(req.presente());
        f.setObservacao(req.observacao());
        Frequencia salva = frequencias.save(f);
        auditoria.registrar("FREQUENCIA", salva.getId(), AcaoAuditoria.CRIACAO,
                "aluno=" + aluno.getId() + ", turma=" + turma.getId() + ", data=" + req.data()
                        + ", presente=" + req.presente());
        return FrequenciaResponse.from(salva);
    }

    /** Chamada da turma inteira (upsert por aluno/data). Falha por completo se algum aluno for inválido. */
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    public List<FrequenciaResponse> registrarLote(FrequenciaLoteRequest req) {
        Turma turma = turma(req.turmaId());
        acesso.exigirEscritaNaTurma(turma);
        validarData(req.data());

        Set<Long> matriculados = new HashSet<>(
                matriculas.findAlunoIdsByTurmaAndSituacao(turma.getId(), SituacaoMatricula.ATIVA));
        Map<Long, Frequencia> existentes = frequencias.findAllByTurmaIdAndData(turma.getId(), req.data()).stream()
                .collect(Collectors.toMap(f -> f.getAluno().getId(), Function.identity()));
        List<Long> ids = req.registros().stream().map(ItemFrequencia::alunoId).toList();
        Map<Long, Aluno> alunosPorId = alunos.findAllById(ids).stream()
                .collect(Collectors.toMap(Aluno::getId, Function.identity()));

        Set<Long> vistos = new HashSet<>();
        List<Frequencia> resultado = new ArrayList<>();
        int novos = 0;
        List<Long> alterados = new ArrayList<>();
        for (ItemFrequencia item : req.registros()) {
            if (!matriculados.contains(item.alunoId())) {
                throw ApiException.regraDeNegocio("Aluno " + item.alunoId() + " não possui matrícula ativa nesta turma.");
            }
            if (!vistos.add(item.alunoId())) {
                throw ApiException.regraDeNegocio("Aluno " + item.alunoId() + " informado mais de uma vez.");
            }
            Frequencia f = existentes.get(item.alunoId());
            if (f == null) {
                f = new Frequencia();
                f.setAluno(alunosPorId.get(item.alunoId()));
                f.setTurma(turma);
                f.setData(req.data());
                novos++;
            } else if (f.isPresente() != item.presente()) {
                alterados.add(item.alunoId());
            }
            f.setPresente(item.presente());
            f.setObservacao(item.observacao());
            resultado.add(f);
        }
        List<FrequenciaResponse> salvos = frequencias.saveAll(resultado).stream().map(FrequenciaResponse::from).toList();
        auditoria.registrar("FREQUENCIA_TURMA", turma.getId(), AcaoAuditoria.LOTE,
                "data=" + req.data() + ", registros=" + resultado.size() + ", novos=" + novos
                        + ", presencaAlteradaDeAlunos=" + alterados);
        return salvos;
    }

    /** SECRETARIO pode corrigir (alteração excepcional) apenas na sua escola. */
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR')")
    public FrequenciaResponse atualizar(Long id, FrequenciaUpdateRequest req) {
        Frequencia f = obter(id);
        acesso.exigirEscritaNaTurma(f.getTurma());
        boolean anterior = f.isPresente();
        f.setPresente(req.presente());
        f.setObservacao(req.observacao());
        auditoria.registrar("FREQUENCIA", id, AcaoAuditoria.ATUALIZACAO,
                "aluno=" + f.getAluno().getId() + ", data=" + f.getData() + ", presente: " + anterior + " -> "
                        + req.presente());
        return FrequenciaResponse.from(f);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','PROFESSOR')")
    public void excluir(Long id) {
        Frequencia f = obter(id);
        acesso.exigirEscritaNaTurma(f.getTurma());
        auditoria.registrar("FREQUENCIA", id, AcaoAuditoria.EXCLUSAO,
                "aluno=" + f.getAluno().getId() + ", turma=" + f.getTurma().getId() + ", data=" + f.getData()
                        + ", presente=" + f.isPresente());
        frequencias.delete(f);
    }

    private void validarData(LocalDate data) {
        if (data.isAfter(LocalDate.now())) {
            throw ApiException.regraDeNegocio("Não é permitido registrar frequência em data futura.");
        }
    }

    private Turma turma(Long id) {
        return turmas.findComEscolaById(id).orElseThrow(() -> ApiException.naoEncontrado("Turma", id));
    }

    private Frequencia obter(Long id) {
        return frequencias.findComTurmaById(id).orElseThrow(() -> ApiException.naoEncontrado("Frequência", id));
    }
}

package br.edu.sige.relatorio;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.aluno.AlunoRepository;
import br.edu.sige.atribuicao.AtribuicaoDocente;
import br.edu.sige.atribuicao.AtribuicaoDocenteRepository;
import br.edu.sige.common.ApiException;
import br.edu.sige.escola.EscolaRepository;
import br.edu.sige.avaliacao.Avaliacao;
import br.edu.sige.avaliacao.AvaliacaoRepository;
import br.edu.sige.frequencia.FrequenciaRepository;
import br.edu.sige.frequencia.ResumoFrequenciaAluno;
import br.edu.sige.matricula.MatriculaRepository;
import br.edu.sige.matricula.Matricula;
import br.edu.sige.matricula.SituacaoMatricula;
import br.edu.sige.nota.Nota;
import br.edu.sige.nota.NotaRepository;
import br.edu.sige.professor.ProfessorRepository;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.UsuarioAutenticado;
import br.edu.sige.turma.TurmaRepository;
import lombok.RequiredArgsConstructor;

/** Relatórios por escopo: ADMIN = rede; SECRETARIO/LEITOR com escola = unidade; PROFESSOR = suas turmas. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO','PROFESSOR','LEITOR')")
public class RelatorioService {

    private final MatriculaRepository matriculas;
    private final TurmaRepository turmas;
    private final ProfessorRepository professores;
    private final EscolaRepository escolas;
    private final AtribuicaoDocenteRepository atribuicoes;
    private final FrequenciaRepository frequencias;
    private final AcessoService acesso;
    private final AlunoRepository alunos;
    private final AvaliacaoRepository avaliacoes;
    private final NotaRepository notas;

    public ResumoResponse resumo() {
        UsuarioAutenticado u = acesso.usuario();
        if (u.perfil() == PerfilNome.PROFESSOR) {
            long qtdTurmas = atribuicoes.findByProfessorUsuarioIdAndAtivoTrue(u.id()).stream()
                    .map(a -> a.getTurma().getId()).distinct().count();
            long alunos = matriculas.contarAlunosDoProfessor(u.id(), SituacaoMatricula.ATIVA);
            return new ResumoResponse("PROFESSOR", alunos, qtdTurmas, null, null);
        }
        Long escolaId = acesso.escolaRestrita();
        if (escolaId != null) {
            return new ResumoResponse("ESCOLA",
                    matriculas.countByTurmaEscolaIdAndSituacao(escolaId, SituacaoMatricula.ATIVA),
                    turmas.countByEscolaId(escolaId), professores.countByEscolaId(escolaId), 1L);
        }
        return new ResumoResponse("REDE", matriculas.countBySituacao(SituacaoMatricula.ATIVA),
                turmas.count(), professores.count(), escolas.count());
    }

    public List<FrequenciaAlunoResponse> frequenciaDaTurma(Long turmaId) {
        acesso.exigirLeituraDaTurma(turmas.findComEscolaById(turmaId)
                .orElseThrow(() -> ApiException.naoEncontrado("Turma", turmaId)));
        Map<Long, ResumoFrequenciaAluno> resumos = frequencias.resumirPorTurma(turmaId).stream()
                .collect(java.util.stream.Collectors.toMap(ResumoFrequenciaAluno::getAlunoId, r -> r));
        return matriculas.findByTurmaIdAndSituacaoOrderByAlunoNomeAsc(turmaId, SituacaoMatricula.ATIVA).stream()
                .map(m -> {
            ResumoFrequenciaAluno r = resumos.get(m.getAluno().getId());
            if (r == null) {
                return new FrequenciaAlunoResponse(m.getAluno().getId(), m.getAluno().getNome(),
                        m.getAluno().getMatricula(), 0, 0, 0, BigDecimal.ZERO);
            }
            long total = r.getTotal();
            long presencas = r.getPresencas();
            BigDecimal pct = total == 0 ? BigDecimal.ZERO
                    : BigDecimal.valueOf(presencas * 100.0 / total).setScale(1, RoundingMode.HALF_UP);
            return new FrequenciaAlunoResponse(r.getAlunoId(), r.getAlunoNome(), r.getAlunoMatricula(), total, presencas,
                    total - presencas, pct);
        }).toList();
    }

    public BoletimAlunoResponse boletimDoAluno(Long alunoId) {
        alunos.findById(alunoId).orElseThrow(() -> ApiException.naoEncontrado("Aluno", alunoId));
        Matricula matricula = matriculas.findByAlunoIdAndSituacao(alunoId, SituacaoMatricula.ATIVA).stream()
                .max(Comparator.comparingInt(m -> m.getAnoLetivo().getAno()))
                .orElseThrow(() -> ApiException.naoEncontrado("Matrícula ativa do aluno", alunoId));
        acesso.exigirLeituraDaTurma(matricula.getTurma());

        ResumoFrequenciaAluno resumo = frequencias.resumirPorAlunoETurma(alunoId, matricula.getTurma().getId())
                .orElse(null);
        long total = resumo == null ? 0 : resumo.getTotal();
        long presencas = resumo == null ? 0 : resumo.getPresencas();
        BigDecimal percentual = total == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(presencas * 100.0 / total).setScale(1, RoundingMode.HALF_UP);

        UsuarioAutenticado u = acesso.usuario();
        List<AtribuicaoDocente> atribuicoesDaTurma = atribuicoes.findByTurmaIdAndAnoLetivoIdAndAtivoTrue(
                matricula.getTurma().getId(), matricula.getAnoLetivo().getId());
        if (u != null && u.perfil() == PerfilNome.PROFESSOR) {
            atribuicoesDaTurma = atribuicoesDaTurma.stream()
                    .filter(a -> a.getProfessor() != null
                            && a.getProfessor().getUsuario() != null
                            && u.id().equals(a.getProfessor().getUsuario().getId()))
                    .toList();
        }
        List<Long> atribuicaoIds = atribuicoesDaTurma.stream().map(AtribuicaoDocente::getId).toList();
        List<Avaliacao> avaliacoesDaTurma = atribuicaoIds.isEmpty()
                ? List.of()
                : avaliacoes.findByAtribuicaoIdInOrderByDataAsc(atribuicaoIds);
        List<Nota> notasDoAluno = atribuicaoIds.isEmpty()
                ? List.of()
                : notas.findByAlunoIdAndAvaliacaoAtribuicaoIdIn(alunoId, atribuicaoIds);
        Map<Long, BigDecimal> notasPorAvaliacao = new HashMap<>();
        notasDoAluno.forEach(n -> notasPorAvaliacao.put(n.getAvaliacao().getId(), n.getValor()));

        List<BoletimAlunoResponse.Disciplina> disciplinasDoBoletim = atribuicoesDaTurma.stream()
                .collect(java.util.stream.Collectors.toMap(
                        a -> a.getDisciplina().getId(),
                        AtribuicaoDocente::getDisciplina,
                        (atual, ignorada) -> atual,
                        java.util.LinkedHashMap::new))
                .entrySet().stream()
                .map(entry -> {
                    Long disciplinaId = entry.getKey();
                    List<BoletimAlunoResponse.Avaliacao> avaliacoesDaDisciplina = avaliacoesDaTurma.stream()
                            .filter(av -> av.getAtribuicao().getDisciplina().getId().equals(disciplinaId))
                            .map(av -> new BoletimAlunoResponse.Avaliacao(
                                    av.getId(), av.getNome(), av.getData(), notasPorAvaliacao.get(av.getId()),
                                    av.getValorMaximo()))
                            .toList();
                    List<BigDecimal> valores = avaliacoesDaDisciplina.stream()
                            .map(BoletimAlunoResponse.Avaliacao::valor)
                            .filter(java.util.Objects::nonNull)
                            .toList();
                    BigDecimal somaMaximos = avaliacoesDaDisciplina.stream()
                            .map(BoletimAlunoResponse.Avaliacao::valorMaximo)
                            .filter(java.util.Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal media = (valores.isEmpty() || somaMaximos.compareTo(BigDecimal.ZERO) <= 0) ? null
                            : valores.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                                    .multiply(BigDecimal.TEN)
                                    .divide(somaMaximos, 2, RoundingMode.HALF_UP);
                    return new BoletimAlunoResponse.Disciplina(
                            disciplinaId, entry.getValue().getNome(), media, avaliacoesDaDisciplina);
                })
                .toList();

        return new BoletimAlunoResponse(
                alunoId,
                matricula.getAluno().getNome(),
                matricula.getId(),
                matricula.getTurma().getNome(),
                matricula.getTurma().getEscola().getNome(),
                matricula.getAnoLetivo().getAno(),
                new BoletimAlunoResponse.Frequencia(total, presencas, total - presencas, percentual),
                disciplinasDoBoletim);
    }
}

package br.edu.sige.transferencia;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

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
import br.edu.sige.escola.Escola;
import br.edu.sige.escola.EscolaRepository;
import br.edu.sige.matricula.Matricula;
import br.edu.sige.matricula.MatriculaRepository;
import br.edu.sige.matricula.SituacaoMatricula;
import br.edu.sige.turma.Turma;
import br.edu.sige.turma.TurmaRepository;
import br.edu.sige.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
public class TransferenciaService {

    private final TransferenciaRepository transferencias;
    private final AlunoRepository alunos;
    private final MatriculaRepository matriculas;
    private final EscolaRepository escolas;
    private final TurmaRepository turmas;
    private final UsuarioRepository usuarios;
    private final AcessoService acesso;
    private final AuditoriaService auditoria;

    public Page<TransferenciaResponse> listar(Pageable pageable) {
        Long escolaId = acesso.escolaRestrita();
        return transferencias.listarEscopo(escolaId == null, escolaId, pageable)
                .map(TransferenciaResponse::from);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public TransferenciaResponse solicitar(SolicitarTransferenciaRequest req) {
        Aluno aluno = alunos.findById(req.alunoId())
                .orElseThrow(() -> ApiException.naoEncontrado("Aluno", req.alunoId()));
        Escola destino = escolas.findById(req.escolaDestinoId())
                .orElseThrow(() -> ApiException.naoEncontrado("Escola", req.escolaDestinoId()));
        List<Matricula> ativas = matriculas.findByAlunoIdAndSituacao(aluno.getId(), SituacaoMatricula.ATIVA);
        Matricula origem = ativas.stream()
                .max(Comparator.comparingInt(m -> m.getAnoLetivo().getAno()))
                .orElseThrow(() -> ApiException.regraDeNegocio("O aluno não possui matrícula ativa para transferir."));
        Long origemEscolaId = origem.getTurma().getEscola().getId();
        acesso.exigirEscolaDoSecretario(origemEscolaId);
        if (origemEscolaId.equals(destino.getId())) {
            throw ApiException.regraDeNegocio("A escola de destino deve ser diferente da escola atual.");
        }
        if (transferencias.existsByMatriculaOrigemIdAndSituacao(origem.getId(), TransferenciaSituacao.PENDENTE)) {
            throw ApiException.conflito("Já existe uma solicitação pendente para esta matrícula.");
        }

        TransferenciaAluno t = new TransferenciaAluno();
        t.setAluno(aluno);
        t.setMatriculaOrigem(origem);
        t.setEscolaDestino(destino);
        t.setSolicitante(usuarios.findById(acesso.usuario().id())
                .orElseThrow(() -> ApiException.naoAutenticado("Usuário não encontrado.")));
        t = transferencias.save(t);
        auditoria.registrar("TRANSFERENCIA", t.getId(), AcaoAuditoria.CRIACAO,
                "aluno=" + aluno.getNome() + " (" + aluno.getId() + "), origem="
                        + origem.getTurma().getEscola().getNome() + ", destino=" + destino.getNome());
        return TransferenciaResponse.from(t);
    }

    @Transactional
    public TransferenciaResponse decidir(Long id, DecidirTransferenciaRequest req) {
        TransferenciaAluno t = transferencias.findById(id)
                .orElseThrow(() -> ApiException.naoEncontrado("Transferência", id));
        if (t.getSituacao() != TransferenciaSituacao.PENDENTE) {
            throw ApiException.regraDeNegocio("Esta solicitação já foi decidida.");
        }
        acesso.exigirEscolaDoSecretario(t.getEscolaDestino().getId());
        var decisor = usuarios.findById(acesso.usuario().id())
                .orElseThrow(() -> ApiException.naoAutenticado("Usuário não encontrado."));
        if (Boolean.TRUE.equals(req.aceitar())) {
            if (req.turmaDestinoId() == null) {
                throw ApiException.regraDeNegocio("Selecione a turma de destino para aceitar a transferência.");
            }
            Turma destino = turmas.findComEscolaById(req.turmaDestinoId())
                    .orElseThrow(() -> ApiException.naoEncontrado("Turma", req.turmaDestinoId()));
            if (!destino.getEscola().getId().equals(t.getEscolaDestino().getId())
                    || !destino.getAnoLetivo().getId().equals(t.getMatriculaOrigem().getAnoLetivo().getId())) {
                throw ApiException.regraDeNegocio("A turma deve pertencer à escola de destino e ao mesmo ano letivo.");
            }
            Matricula origem = t.getMatriculaOrigem();
            origem.setSituacao(SituacaoMatricula.TRANSFERIDA);
            // Release the partial unique index before Hibernate inserts the destination enrollment.
            matriculas.flush();
            Matricula nova = new Matricula();
            nova.setAluno(t.getAluno());
            nova.setTurma(destino);
            nova.setAnoLetivo(origem.getAnoLetivo());
            nova.setSituacao(SituacaoMatricula.ATIVA);
            nova.setDataMatricula(java.time.LocalDate.now());
            matriculas.save(nova);
            t.setTurmaDestino(destino);
            t.setSituacao(TransferenciaSituacao.ACEITA);
            t.setJustificativa(null);
        } else {
            if (req.justificativa() == null || req.justificativa().isBlank()) {
                throw ApiException.regraDeNegocio("Informe a justificativa para recusar a transferência.");
            }
            t.setSituacao(TransferenciaSituacao.RECUSADA);
            t.setJustificativa(req.justificativa().trim());
        }
        t.setDecididaPor(decisor);
        t.setDecididaEm(Instant.now());
        auditoria.registrar("TRANSFERENCIA", id, AcaoAuditoria.ATUALIZACAO,
                "aluno=" + t.getAluno().getNome() + " (" + t.getAluno().getId() + "), "
                        + (req.aceitar() ? "transferência aceita para " + t.getEscolaDestino().getNome()
                                : "transferência recusada: " + t.getJustificativa()));
        return TransferenciaResponse.from(t);
    }
}

package br.edu.sige.turma;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.acesso.AcessoService;
import br.edu.sige.anoletivo.AnoLetivo;
import br.edu.sige.anoletivo.AnoLetivoRepository;
import br.edu.sige.common.ApiException;
import br.edu.sige.escola.Escola;
import br.edu.sige.escola.EscolaRepository;
import br.edu.sige.security.PerfilNome;
import br.edu.sige.security.UsuarioAutenticado;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TurmaService {

    private final TurmaRepository turmas;
    private final EscolaRepository escolas;
    private final AnoLetivoRepository anos;
    private final AcessoService acesso;

    /** PROFESSOR vê só as suas turmas; SECRETARIO/LEITOR com escola veem a sua escola; demais veem a rede. */
    public Page<TurmaResponse> listar(Pageable pageable) {
        UsuarioAutenticado u = acesso.usuario();
        Page<Turma> pagina;
        if (u.perfil() == PerfilNome.PROFESSOR) {
            pagina = turmas.findDoProfessor(u.id(), pageable);
        } else {
            Long escolaId = acesso.escolaRestrita();
            pagina = escolaId != null ? turmas.findByEscolaId(escolaId, pageable) : turmas.findAll(pageable);
        }
        return pagina.map(TurmaResponse::from);
    }

    public TurmaResponse buscar(Long id) {
        Turma t = obter(id);
        acesso.exigirLeituraDaTurma(t);
        return TurmaResponse.from(t);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public TurmaResponse criar(TurmaRequest req) {
        acesso.exigirEscolaDoSecretario(req.escolaId());
        Turma t = new Turma();
        aplicar(t, req);
        return TurmaResponse.from(turmas.save(t));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public TurmaResponse atualizar(Long id, TurmaRequest req) {
        Turma t = obter(id);
        acesso.exigirEscolaDoSecretario(t.getEscola().getId());   // escola atual
        acesso.exigirEscolaDoSecretario(req.escolaId());          // escola de destino
        aplicar(t, req);
        return TurmaResponse.from(t);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','SECRETARIO')")
    public void excluir(Long id) {
        Turma t = obter(id);
        acesso.exigirEscolaDoSecretario(t.getEscola().getId());
        turmas.delete(t);
        turmas.flush();
    }

    private void aplicar(Turma t, TurmaRequest req) {
        Escola escola = escolas.findById(req.escolaId())
                .orElseThrow(() -> ApiException.naoEncontrado("Escola", req.escolaId()));
        AnoLetivo ano = anos.findById(req.anoLetivoId())
                .orElseThrow(() -> ApiException.naoEncontrado("Ano letivo", req.anoLetivoId()));
        t.setNome(req.nome().trim());
        t.setSerie(req.serie().trim());
        t.setTurno(req.turno());
        t.setEscola(escola);
        t.setAnoLetivo(ano);
    }

    private Turma obter(Long id) {
        return turmas.findComEscolaById(id).orElseThrow(() -> ApiException.naoEncontrado("Turma", id));
    }
}

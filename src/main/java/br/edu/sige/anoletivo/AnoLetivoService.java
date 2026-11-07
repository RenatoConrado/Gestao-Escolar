package br.edu.sige.anoletivo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.sige.common.ApiException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnoLetivoService {

    private final AnoLetivoRepository anos;

    public Page<AnoLetivoResponse> listar(Pageable pageable) {
        return anos.findAll(pageable).map(AnoLetivoResponse::from);
    }

    public AnoLetivoResponse buscar(Long id) {
        return AnoLetivoResponse.from(obter(id));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public AnoLetivoResponse criar(AnoLetivoRequest req) {
        if (anos.existsByAno(req.ano())) {
            throw ApiException.conflito("O ano letivo " + req.ano() + " já está cadastrado.");
        }
        AnoLetivo a = new AnoLetivo();
        aplicar(a, req);
        return AnoLetivoResponse.from(anos.save(a));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public AnoLetivoResponse atualizar(Long id, AnoLetivoRequest req) {
        AnoLetivo a = obter(id);
        if (anos.existsByAnoAndIdNot(req.ano(), id)) {
            throw ApiException.conflito("O ano letivo " + req.ano() + " já está cadastrado.");
        }
        aplicar(a, req);
        return AnoLetivoResponse.from(a);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void excluir(Long id) {
        anos.delete(obter(id));
        anos.flush();
    }

    private void aplicar(AnoLetivo a, AnoLetivoRequest req) {
        if (!req.dataFim().isAfter(req.dataInicio())) {
            throw ApiException.regraDeNegocio("A data de fim deve ser posterior à data de início.");
        }
        a.setAno(req.ano());
        a.setDataInicio(req.dataInicio());
        a.setDataFim(req.dataFim());
    }

    private AnoLetivo obter(Long id) {
        return anos.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Ano letivo", id));
    }
}

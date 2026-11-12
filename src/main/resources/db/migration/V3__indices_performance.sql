-- V3: índices compostos de performance para escalabilidade em hardware restrito (Orange Pi)
CREATE INDEX IF NOT EXISTS idx_matriculas_ano_situacao ON matriculas (ano_letivo_id, situacao);
CREATE INDEX IF NOT EXISTS idx_auditoria_em_desc ON auditoria_eventos (em DESC);
CREATE INDEX IF NOT EXISTS idx_notas_aluno_avaliacao ON notas (aluno_id, avaliacao_id);


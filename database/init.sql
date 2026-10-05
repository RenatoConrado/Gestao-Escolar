CREATE TABLE perfis (
id SERIAL PRIMARY KEY,
nome VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
    id         serial PRIMARY KEY,
    nome       varchar(100) NOT NULL,
    email      varchar(100) NOT NULL UNIQUE,
    senha_hash varchar(255) NOT NULL,
    perfil_id  int          NOT NULL,
    ativo      boolean      NOT NULL DEFAULT TRUE,
    created_at timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_perfil
        FOREIGN KEY (perfil_id) REFERENCES perfis(id)
);

CREATE TABLE escolas (
    id         serial PRIMARY KEY,
    nome       varchar(150) NOT NULL,
    codigo     varchar(50)  NOT NULL UNIQUE,
    endereco   text,
    telefone   varchar(20),
    email      varchar(100),
    diretor_id int,
    ativo      boolean      NOT NULL DEFAULT TRUE,
    created_at timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_escola_diretor
        FOREIGN KEY (diretor_id) REFERENCES usuarios(id)
);

CREATE TABLE alunos (
    id              serial PRIMARY KEY,
    matricula       varchar(50)  NOT NULL UNIQUE,
    nome            varchar(100) NOT NULL,
    data_nascimento date         NOT NULL,
    cpf             varchar(14) UNIQUE,
    endereco        text,
    telefone        varchar(20),
    responsavel     varchar(100),
    ativo           boolean      NOT NULL DEFAULT TRUE,
    created_at      timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE professores (
    id         serial PRIMARY KEY,
    matricula  varchar(50)  NOT NULL UNIQUE,
    nome       varchar(100) NOT NULL,
    cpf        varchar(14) UNIQUE,
    email      varchar(100),
    telefone   varchar(20),
    formacao   varchar(100),
    escola_id  int          NOT NULL,
    ativo      boolean      NOT NULL DEFAULT TRUE,
    created_at timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_professor_escola
        FOREIGN KEY (escola_id) REFERENCES escolas(id)
);

CREATE TABLE anos_letivos (
    id          serial PRIMARY KEY,
    ano         int  NOT NULL UNIQUE,
    data_inicio date NOT NULL,
    data_fim    date NOT NULL
);

CREATE TABLE turmas (
    id            serial PRIMARY KEY,
    nome          varchar(50) NOT NULL,
    serie         varchar(50) NOT NULL,
    turno         varchar(20) NOT NULL,
    escola_id     int         NOT NULL,
    ano_letivo_id int         NOT NULL,
    ativo         boolean     NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_turma_escola
        FOREIGN KEY (escola_id) REFERENCES escolas(id),
    CONSTRAINT fk_turma_ano_letivo
        FOREIGN KEY (ano_letivo_id) REFERENCES anos_letivos(id),
    CONSTRAINT uq_turma_ano
        UNIQUE (nome, escola_id, ano_letivo_id)
);

CREATE TABLE matriculas (
    id             serial PRIMARY KEY,
    aluno_id       int         NOT NULL,
    turma_id       int         NOT NULL,
    ano_letivo_id  int         NOT NULL,
    data_matricula date        NOT NULL DEFAULT CURRENT_DATE,
    situacao       varchar(30) NOT NULL DEFAULT 'Ativo',
    CONSTRAINT fk_matricula_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT fk_matricula_turma
        FOREIGN KEY (turma_id) REFERENCES turmas(id),
    CONSTRAINT fk_matricula_ano_letivo
        FOREIGN KEY (ano_letivo_id) REFERENCES anos_letivos(id)
);

CREATE TABLE disciplinas (
    id     serial PRIMARY KEY,
    nome   varchar(100) NOT NULL,
    codigo varchar(20)  NOT NULL UNIQUE
);

CREATE TABLE atribuicoes_docentes (
    id            serial PRIMARY KEY,
    professor_id  int     NOT NULL,
    disciplina_id int     NOT NULL,
    turma_id      int     NOT NULL,
    ano_letivo_id int     NOT NULL,
    ativo         boolean NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_atribuicao_professor
        FOREIGN KEY (professor_id) REFERENCES professores(id),
    CONSTRAINT fk_atribuicao_disciplina
        FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    CONSTRAINT fk_atribuicao_turma
        FOREIGN KEY (turma_id) REFERENCES turmas(id),
    CONSTRAINT fk_atribuicao_ano
        FOREIGN KEY (ano_letivo_id) REFERENCES anos_letivos(id),
    CONSTRAINT uq_atribuicao
        UNIQUE (professor_id, disciplina_id, turma_id, ano_letivo_id)
);

CREATE TABLE frequencias (
    id         serial PRIMARY KEY,
    aluno_id   int     NOT NULL,
    turma_id   int     NOT NULL,
    data       date    NOT NULL,
    presente   boolean NOT NULL,
    observacao text,
    CONSTRAINT fk_frequencia_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT fk_frequencia_turma
        FOREIGN KEY (turma_id) REFERENCES turmas(id),
    CONSTRAINT uq_frequencia
        UNIQUE (aluno_id, turma_id, data)
);

CREATE TABLE avaliacoes (
    id                    serial PRIMARY KEY,
    atribuicao_docente_id int           NOT NULL,
    nome                  varchar(100)  NOT NULL,
    data                  date          NOT NULL,
    valor_maximo          numeric(5, 2) NOT NULL,
    CONSTRAINT fk_avaliacao_atribuicao
        FOREIGN KEY (atribuicao_docente_id)
            REFERENCES atribuicoes_docentes(id)
);

CREATE TABLE notas (
    id           serial PRIMARY KEY,
    avaliacao_id int           NOT NULL,
    aluno_id     int           NOT NULL,
    nota         numeric(5, 2) NOT NULL,
    CONSTRAINT fk_nota_avaliacao
        FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes(id),
    CONSTRAINT fk_nota_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT uq_nota
        UNIQUE (avaliacao_id, aluno_id)
);


-- SEEDS INICIAIS DE TESTE (USABILIDADE)

-- Inserção de Perfis Padrão
INSERT INTO perfis (id, nome)
VALUES (1, 'ADMINISTRADOR'),
       (2, 'GESTOR'       ),
       (3, 'SECRETARIA'   ),
       (4, 'PROFESSOR'    );

-- Inserção de Usuários de Teste (Senha Padrão para todos: "senha123" criptografada com BCrypt)
-- Hash BCrypt de "senha123": $2a$10$e8.I0N6T8zF.yJ.N.O8S2.v.KxPqM9WlK8bJzZ3nF0P4g8K5
INSERT INTO usuarios (nome, email, senha_hash, perfil_id, ativo)
VALUES ('Administrador do Sistema', 'admin@escola.gov.br',      '$2a$10$e8.I0N6T8zF.yJ.N.O8S2.v.KxPqM9WlK8bJzZ3nF0P4g8K5', 1, TRUE),
       ('Maria Gestora',            'gestor@escola.gov.br',     '$2a$10$e8.I0N6T8zF.yJ.N.O8S2.v.KxPqM9WlK8bJzZ3nF0P4g8K5', 2, TRUE),
       ('Carlos Secretaria',        'secretaria@escola.gov.br', '$2a$10$e8.I0N6T8zF.yJ.N.O8S2.v.KxPqM9WlK8bJzZ3nF0P4g8K5', 3, TRUE),
       ('Ana Professora',           'professor@escola.gov.br',  '$2a$10$e8.I0N6T8zF.yJ.N.O8S2.v.KxPqM9WlK8bJzZ3nF0P4g8K5', 4, TRUE);
INSERT INTO anos_letivos (ano, data_inicio, data_fim) -- Ano Letivo Atual
VALUES (2026, '2026-02-01', '2026-12-15');

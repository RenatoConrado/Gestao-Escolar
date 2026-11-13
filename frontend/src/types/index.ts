export type PerfilRole = 'ADMIN' | 'SECRETARIO' | 'PROFESSOR' | 'LEITOR';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilRole;
  escolaId?: number | null;
  ativo: boolean;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEm: string;
  usuario: Usuario;
}

export interface Escola {
  id: number;
  nome: string;
  codigo: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  diretorId?: number | null;
}

export type Turno = 'MANHA' | 'TARDE' | 'NOITE' | 'INTEGRAL';

export interface Turma {
  id: number;
  nome: string;
  serie: string;
  turno: Turno;
  anoLetivoId: number;
  anoLetivo: number;
  escolaId: number;
  escolaNome: string;
}

export interface Aluno {
  id: number;
  matricula: string;
  nome: string;
  dataNascimento: string;
  cpf?: string; // Mascarado se PROFESSOR ou LEITOR
  endereco?: string;
  telefone?: string;
  responsavel?: string;
}

export interface AtribuicaoDocente {
  id: number;
  professorId: number;
  professorNome: string;
  turmaId: number;
  turmaNome: string;
  serie: string;
  turno: string;
  escolaId: number;
  escolaNome: string;
  disciplinaId: number;
  disciplinaNome: string;
  anoLetivoId: number;
  anoLetivo: number;
  ativo: boolean;
}

export interface ItemFrequenciaLote {
  alunoId: number;
  presente: boolean;
  observacao?: string | null;
}

export interface SalvarChamadaLoteRequest {
  turmaId: number;
  data: string; // YYYY-MM-DD
  registros: ItemFrequenciaLote[];
}

export interface Disciplina {
  id: number;
  nome: string;
  codigo: string;
  cargaHoraria?: number;
}

export interface ResumoRedeResponse {
  escopo?: 'REDE' | 'ESCOLA' | 'PROFESSOR';
  alunosMatriculados?: number;
  turmas?: number;
  professores?: number | null;
  escolas?: number | null;
}

export interface ResumoEscolaResponse {
  escolaId: number;
  escolaNome: string;
  totalAlunosAtivos: number;
  totalTurmas: number;
  totalProfessores: number;
  frequenciaMedia: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiCampoErro {
  campo: string;
  mensagem: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  campos?: ApiCampoErro[];
  retryAfterSeconds?: number;
}

export interface BoletimAluno {
  alunoId: number;
  alunoNome: string;
  matriculaId: number | null;
  turmaNome: string | null;
  escolaNome: string | null;
  anoLetivo: number | null;
  frequencia: {
    totalRegistros: number;
    presencas: number;
    faltas: number;
    percentualPresenca: number;
  };
  disciplinas: {
    disciplinaId: number;
    disciplinaNome: string;
    media: number | null;
    avaliacoes: {
      id: number;
      nome: string;
      data: string;
      valor: number | null;
      valorMaximo: number;
    }[];
  }[];
}

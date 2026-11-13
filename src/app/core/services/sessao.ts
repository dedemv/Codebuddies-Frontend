import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Fase {
  id: number;
  nivel: number;
  titulo: string;
  tipo: 'digitacao' | 'logica' | 'mouse';
  status: 'liberada' | 'bloqueada' | 'concluida';
  estrelas: number;
}

export interface Personagem {
  id: string;
  nome: string;
  icone: string;
  fala: string;
  estrelasNecessarias: number;
}

export interface AlunoSessao {
  id: number;
  nome: string;
  idade: number;
  personagem: Personagem;
  nivelAtual: number;
  estrelasTotal: number;
  fasesConcluidas: number;
  ativo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Sessao {
  public sessaoAbertaMock = true;
  public nomeTurmaAtual = 'Turma AMPLA - Platina';

  public personagens: Personagem[] = [
    { id: 'robo-menin', nome: 'Bia Bot (Feminino)', icone: '👩‍🚀', fala: 'Vamos explorar o espaço digital!', estrelasNecessarias: 0 },
    { id: 'robo-menino', nome: 'Leo Bit (Masculino)', icone: '🧑‍🚀', fala: 'Pronto para programar essa missão!', estrelasNecessarias: 0 },
    { id: 'coruja-sabia', nome: 'Coruja Byte', icone: '🦉', fala: 'A lógica é o nosso superpoder!', estrelasNecessarias: 3 },
    { id: 'dragao-code', nome: 'Dragão Pixel', icone: '🐲', fala: 'Você já é um mestre do teclado!', estrelasNecessarias: 6 }
  ];

  private fasesMock: Fase[] = [
    { id: 1, nivel: 1, titulo: 'Fase 1: Caça às Letras', tipo: 'digitacao', status: 'liberada', estrelas: 0 },
    { id: 2, nivel: 1, titulo: 'Fase 2: Clique Rápido', tipo: 'mouse', status: 'bloqueada', estrelas: 0 },
    { id: 3, nivel: 1, titulo: 'Fase 3: Sequência Lógica', tipo: 'logica', status: 'bloqueada', estrelas: 0 }
  ];

  private historicoMock: { faseTitulo: string; estrelas: number; data: string }[] = [];

  // Lista simulada de alunos na sessão para o painel do professor e ranking (RF-D07, RF-P13)
  private alunosSessaoMock: AlunoSessao[] = [
    { id: 1, nome: 'Ana Clara', idade: 6, personagem: this.personagens[0], nivelAtual: 1, estrelasTotal: 12, fasesConcluidas: 3, ativo: true },
    { id: 2, nome: 'Pedro Henrique', idade: 7, personagem: this.personagens[1], nivelAtual: 1, estrelasTotal: 9, fasesConcluidas: 2, ativo: true },
    { id: 3, nome: 'Mateus', idade: 5, personagem: this.personagens[2], nivelAtual: 1, estrelasTotal: 5, fasesConcluidas: 1, ativo: true }
  ];

  constructor(private http: HttpClient) {}

  verificarSessaoAberta(): Observable<{ aberta: boolean; turma: string }> {
    if (typeof window !== 'undefined') {
      const statusSalvo = localStorage.getItem('sessao_aberta_codebuddies');
      if (statusSalvo !== null) {
        this.sessaoAbertaMock = JSON.parse(statusSalvo);
      }
      const turmaSalva = localStorage.getItem('nome_turma_codebuddies');
      if (turmaSalva) {
        this.nomeTurmaAtual = turmaSalva;
      }
    }
    return of({ aberta: this.sessaoAbertaMock, turma: this.nomeTurmaAtual });
  }

  // UC 04: Criar e Abrir Sessão de Aula
  abrirSessao(nomeTurma: string): void {
    this.nomeTurmaAtual = nomeTurma || 'Turma AMPLA - Platina';
    this.sessaoAbertaMock = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessao_aberta_codebuddies', 'true');
      localStorage.setItem('nome_turma_codebuddies', this.nomeTurmaAtual);
    }
  }

  // UC 05: Encerrar Sessão e bloquear novos logins
  encerrarSessao(): void {
    this.sessaoAbertaMock = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessao_aberta_codebuddies', 'false');
    }
  }

  // RF-P01, RF-P03, RF-D09: Cria ou recupera aluno sem duplicar o par (nome, idade)
  entrarNaSessao(nome: string, idade: number): Observable<any> {
    const atual = this.obterAlunoLogado();
    const aluno = {
      nome,
      idade,
      personagem: atual?.personagem || this.personagens[0]
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('aluno_codebuddies', JSON.stringify(aluno));
    }

    // Verifica se o par (nome, idade) já existe na lista da sessão (RF-P02, RF-P03)
    const existente = this.alunosSessaoMock.find(
      a => a.nome.toLowerCase() === nome.toLowerCase() && a.idade === idade
    );
    if (!existente) {
      this.alunosSessaoMock.push({
        id: this.alunosSessaoMock.length + 1,
        nome,
        idade,
        personagem: aluno.personagem,
        nivelAtual: 1,
        estrelasTotal: this.obterTotalEstrelas(),
        fasesConcluidas: this.fasesMock.filter(f => f.status === 'concluida').length,
        ativo: true
      });
    }

    return of(aluno);
  }

  selecionarPersonagem(personagem: Personagem): void {
    const aluno = this.obterAlunoLogado();
    if (aluno && typeof window !== 'undefined') {
      aluno.personagem = personagem;
      localStorage.setItem('aluno_codebuddies', JSON.stringify(aluno));
    }
  }

  obterAlunoLogado() {
    if (typeof window === 'undefined') return null;
    const dados = localStorage.getItem('aluno_codebuddies');
    return dados ? JSON.parse(dados) : null;
  }

  obterFases(): Fase[] {
    return this.fasesMock;
  }

  obterTotalEstrelas(): number {
    return this.fasesMock.reduce((soma, f) => soma + f.estrelas, 0);
  }

  obterHistorico() {
    return this.historicoMock;
  }

  salvarResultadoFase(idFase: number, estrelasObtidas: number) {
    const index = this.fasesMock.findIndex(f => f.id === idFase);
    if (index !== -1) {
      const fase = this.fasesMock[index];

      this.historicoMock.unshift({
        faseTitulo: fase.titulo,
        estrelas: estrelasObtidas,
        data: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      if (estrelasObtidas > fase.estrelas) {
        fase.estrelas = estrelasObtidas;
      }

      if (fase.estrelas >= 3) {
        fase.status = 'concluida';
        if (this.fasesMock[index + 1] && this.fasesMock[index + 1].status === 'bloqueada') {
          this.fasesMock[index + 1].status = 'liberada';
        }
      }

      // Atualiza também na tabela do professor
      const logado = this.obterAlunoLogado();
      if (logado) {
        const registro = this.alunosSessaoMock.find(
          a => a.nome.toLowerCase() === logado.nome.toLowerCase()
        );
        if (registro) {
          registro.estrelasTotal = this.obterTotalEstrelas();
          registro.fasesConcluidas = this.fasesMock.filter(f => f.status === 'concluida').length;
        }
      }
    }
  }

  // RF-D07: Listar todos os alunos da sessão (ativos e desativados)
  obterAlunosDaSessao(): AlunoSessao[] {
    return this.alunosSessaoMock;
  }

  // UC 06 / RF-D08 / RN10: Desativar ou reativar aluno preservando histórico
  alternarStatusAluno(id: number): void {
    const aluno = this.alunosSessaoMock.find(a => a.id === id);
    if (aluno) {
      aluno.ativo = !aluno.ativo;
    }
  }

  // RF-P13 / RF-D12: Gerar ranking ordenado por estrelas dos alunos ativos
  obterRanking(): AlunoSessao[] {
    return [...this.alunosSessaoMock]
      .filter(a => a.ativo)
      .sort((a, b) => b.estrelasTotal - a.estrelasTotal);
  }
}
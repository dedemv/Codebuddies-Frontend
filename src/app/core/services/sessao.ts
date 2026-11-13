import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Fase {
  id: number;
  nivel: number;
  subtitulo: string;
  titulo: string;
  etapaNome: string;
  corCard: string;
  mascoteIcone: string;
  tipo: 'digitacao' | 'logica' | 'mouse';
  status: 'liberada' | 'bloqueada' | 'concluida';
  estrelas: number;
}

export interface Personagem {
  id: string;
  nome: string;
  icone: string;
  posX: string; // Posição horizontal na imagem
  posY: string; // Posição vertical na imagem
  corFundo: string;
  fala: string;
  estrelasNecessarias: number;
}

export interface AlunoSessao {
  id: number;
  nome: string;
  idade: number;
  cargoNivel: string;
  progressoPct: number;
  personagem: Personagem;
  nivelAtual: number;
  estrelasTotal: number;
  pontos: number;
  fasesConcluidas: number;
  ativo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Sessao {
  private apiUrl = 'http://localhost:3333/api';

  public sessaoAbertaMock = true;
  public nomeTurmaAtual = 'Turma AMPLA - Platina';
  public sessaoIdAtual: string | number = 1;

  // Os 6 Personagens oficiais do Design do Grupo
  public personagens: Personagem[] = [
    { id: 'white-dog', nome: 'White Dog', icone: '🐻‍❄️', posX: '0%',   posY: '0%',   corFundo: '#e3f2fd', fala: 'Vamos dar os primeiros passos!', estrelasNecessarias: 0 },
    { id: 'pig',       nome: 'Pig',       icone: '🐷',   posX: '50%',  posY: '0%',   corFundo: '#fce4ec', fala: 'Programar é muito divertido!', estrelasNecessarias: 0 },
    { id: 'green-dog', nome: 'Green Dog', icone: '🐸',   posX: '100%', posY: '0%',   corFundo: '#e8f5e9', fala: 'Coloque o fone e vamos codar!', estrelasNecessarias: 0 },
    { id: 'puppy',     nome: 'Puppy',     icone: '🐶',   posX: '0%',   posY: '100%', corFundo: '#fff9c4', fala: 'Qual é o próximo comando?', estrelasNecessarias: 3 },
    { id: 'duck',      nome: 'Space Duck',icone: '🐦',   posX: '50%',  posY: '100%', corFundo: '#e1f5fe', fala: 'Explorando o universo dos códigos!', estrelasNecessarias: 5 },
    { id: 'fox',       nome: 'Fox',       icone: '🦊',   posX: '100%', posY: '100%', corFundo: '#fff3e0', fala: 'Você já domina as funções!', estrelasNecessarias: 8 }
  ];

  // As 5 Fases do Design ("Fases do Jogo")
  private fasesMock: Fase[] = [
    { id: 1, nivel: 1, subtitulo: 'FASE 01', titulo: 'Primeiros passos', etapaNome: 'Iniciante', corCard: 'verde', mascoteIcone: '🐻‍❄️', tipo: 'digitacao', status: 'liberada', estrelas: 4 },
    { id: 2, nivel: 1, subtitulo: 'FASE 02', titulo: 'Comandos', etapaNome: 'Comandos', corCard: 'azul', mascoteIcone: '🐦', tipo: 'mouse', status: 'liberada', estrelas: 2 },
    { id: 3, nivel: 1, subtitulo: 'FASE 03', titulo: 'Loops', etapaNome: 'Loops', corCard: 'roxo', mascoteIcone: '🐸', tipo: 'logica', status: 'bloqueada', estrelas: 0 },
    { id: 4, nivel: 1, subtitulo: 'FASE 04', titulo: 'Funções', etapaNome: 'Funções', corCard: 'rosa', mascoteIcone: '🦊', tipo: 'logica', status: 'bloqueada', estrelas: 0 },
    { id: 5, nivel: 1, subtitulo: 'FASE 05', titulo: 'Projetos Finais', etapaNome: 'Projetos', corCard: 'laranja', mascoteIcone: '🤖', tipo: 'digitacao', status: 'bloqueada', estrelas: 0 }
  ];

  private historicoMock: { faseTitulo: string; estrelas: number; data: string }[] = [];

  // Alunos conforme a tela de Alunos e Ranking do protótipo
  private alunosSessaoMock: AlunoSessao[] = [
    { id: 1, nome: 'Ana Clara', idade: 6, cargoNivel: 'Explorador', progressoPct: 80, personagem: this.personagens[3], nivelAtual: 1, estrelasTotal: 5, pontos: 1250, fasesConcluidas: 4, ativo: true },
    { id: 2, nome: 'Lucas Silva', idade: 7, cargoNivel: 'Programador', progressoPct: 60, personagem: this.personagens[2], nivelAtual: 1, estrelasTotal: 4, pontos: 1120, fasesConcluidas: 3, ativo: true },
    { id: 3, nome: 'Sofia / Maria Eduarda', idade: 5, cargoNivel: 'Iniciante', progressoPct: 40, personagem: this.personagens[1], nivelAtual: 1, estrelasTotal: 4, pontos: 980, fasesConcluidas: 2, ativo: true },
    { id: 4, nome: 'Pedro Henrique', idade: 8, cargoNivel: 'Avançado', progressoPct: 90, personagem: this.personagens[5], nivelAtual: 1, estrelasTotal: 3, pontos: 870, fasesConcluidas: 2, ativo: true },
    { id: 5, nome: 'Juliana Souza', idade: 6, cargoNivel: 'Explorador', progressoPct: 70, personagem: this.personagens[0], nivelAtual: 1, estrelasTotal: 3, pontos: 760, fasesConcluidas: 2, ativo: true }
  ];

  constructor(private http: HttpClient) {}

  verificarSessaoAberta(): Observable<{ aberta: boolean; turma: string }> {
    return this.http.get<any>(`${this.apiUrl}/sessoes/ativa`).pipe(
      map(res => ({
        aberta: res?.status === 'aberta' || res?.aberta === true,
        turma: res?.turma?.nome || res?.nomeTurma || this.nomeTurmaAtual
      })),
      catchError(() => {
        if (typeof window !== 'undefined') {
          const statusSalvo = localStorage.getItem('sessao_aberta_codebuddies');
          if (statusSalvo !== null) this.sessaoAbertaMock = JSON.parse(statusSalvo);
          const turmaSalva = localStorage.getItem('nome_turma_codebuddies');
          if (turmaSalva) this.nomeTurmaAtual = turmaSalva;
        }
        return of({ aberta: this.sessaoAbertaMock, turma: this.nomeTurmaAtual });
      })
    );
  }

  abrirSessao(nomeTurma: string): void {
    this.nomeTurmaAtual = nomeTurma || 'Turma AMPLA - Platina';
    this.sessaoAbertaMock = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessao_aberta_codebuddies', 'true');
      localStorage.setItem('nome_turma_codebuddies', this.nomeTurmaAtual);
    }

    this.http.post<any>(`${this.apiUrl}/sessoes`, { nomeTurma: this.nomeTurmaAtual }).pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      if (res?.id) this.sessaoIdAtual = res.id;
    });
  }

  encerrarSessao(): void {
    this.sessaoAbertaMock = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessao_aberta_codebuddies', 'false');
    }

    this.http.patch(`${this.apiUrl}/sessoes/${this.sessaoIdAtual}/encerrar`, {}).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  entrarNaSessao(nome: string, idade: number): Observable<any> {
    const atual = this.obterAlunoLogado();
    const alunoLocal = {
      id: Date.now(),
      nome,
      idade,
      personagem: atual?.personagem || this.personagens[0]
    };

    return this.http.post<any>(`${this.apiUrl}/alunos/entrar`, { nome, idade }).pipe(
      tap(res => {
        const dadosSalvar = { ...alunoLocal, ...(res || {}) };
        this.salvarAlunoNoStorage(dadosSalvar);
      }),
      catchError(() => {
        this.salvarAlunoNoStorage(alunoLocal);
        return of(alunoLocal);
      })
    );
  }

  private salvarAlunoNoStorage(aluno: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aluno_codebuddies', JSON.stringify(aluno));
    }
    const existente = this.alunosSessaoMock.find(
      a => a.nome.toLowerCase() === aluno.nome.toLowerCase() && a.idade === aluno.idade
    );
    if (!existente) {
      this.alunosSessaoMock.push({
        id: aluno.id || this.alunosSessaoMock.length + 1,
        nome: aluno.nome,
        idade: aluno.idade,
        cargoNivel: 'Iniciante',
        progressoPct: 20,
        personagem: aluno.personagem || this.personagens[0],
        nivelAtual: 1,
        estrelasTotal: this.obterTotalEstrelas(),
        pontos: this.obterTotalEstrelas() * 250,
        fasesConcluidas: this.fasesMock.filter(f => f.status === 'concluida').length,
        ativo: true
      });
    }
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

  obterTotalPontos(): number {
    return this.obterTotalEstrelas() * 210;
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

      const logado = this.obterAlunoLogado();
      if (logado) {
        const registro = this.alunosSessaoMock.find(
          a => a.nome.toLowerCase() === logado.nome.toLowerCase()
        );
        if (registro) {
          registro.estrelasTotal = this.obterTotalEstrelas();
          registro.pontos = this.obterTotalPontos();
          registro.fasesConcluidas = this.fasesMock.filter(f => f.status === 'concluida').length;
          registro.progressoPct = Math.min(100, registro.fasesConcluidas * 20);
        }

        this.http.post(`${this.apiUrl}/tentativas`, {
          alunoId: logado.id,
          faseId: idFase,
          estrelas: estrelasObtidas
        }).pipe(catchError(() => of(null))).subscribe();
      }
    }
  }

  obterAlunosDaSessao(): AlunoSessao[] {
    return this.alunosSessaoMock;
  }

  alternarStatusAluno(id: number): void {
    const aluno = this.alunosSessaoMock.find(a => a.id === id);
    if (aluno) {
      aluno.ativo = !aluno.ativo;
      this.http.patch(`${this.apiUrl}/alunos/${id}/status`, { ativo: aluno.ativo })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  obterRanking(): AlunoSessao[] {
    return [...this.alunosSessaoMock]
      .filter(a => a.ativo)
      .sort((a, b) => b.pontos - a.pontos);
  }
}


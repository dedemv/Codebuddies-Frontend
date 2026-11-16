import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Personagem {
  id: string;
  nome: string;
  icone: string;
  imagem?: string;
  posX: string;
  posY: string;
  corFundo: string;
  fala: string;
  estrelasNecessarias: number;
}

export interface FaseMapa {
  faseId: number;
  id: number;
  nivel: number;
  subtitulo: string;
  titulo: string;
  etapaNome: string;
  tipo: 'DIGITACAO' | 'LOGICA' | 'MOUSE' | 'digitacao' | 'logica' | 'mouse';
  nivelId: number;
  nivelOrdem: number;
  nivelTitulo: string;
  ordem: number;
  status: 'LIBERADA' | 'BLOQUEADA' | 'CONCLUIDA' | 'liberada' | 'bloqueada' | 'concluida';
  melhorEstrelas: number;
  estrelas: number;
  corCard: 'verde' | 'azul' | 'roxo' | 'rosa' | 'laranja' | string;
  mascoteIcone?: string;
  videoClasse?: string;
  posX: string;
  posY: string;
}

export type Fase = FaseMapa;

export interface AlunoSessao {
  id: number;
  nome: string;
  idade: number;
  nivelAtual: number;
  cargoNivel: string;
  estrelasTotal: number;
  pontos: number;
  fasesConcluidas: number;
  progressoPct: number;
  ativo: boolean;
  personagem: Personagem;
}

@Injectable({
  providedIn: 'root'
})
export class Sessao {
  // Endereço oficial do GUIA_FRONT.md
  public readonly apiUrl = 'http://localhost:3333/api';

  // Começa como false até o professor abrir a sessão ou o back-end confirmar
  public sessaoAbertaLocal = false;

  // Propriedade que verifica se está rodando no navegador (evita erro no SSR)
  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  }

  public personagens: Personagem[] = [
    { id: 'white-dog', nome: 'White Dog', icone: '🐻‍❄️', imagem: '/personagens/white-dog.png', posX: '0%', posY: '0%', corFundo: '#a5d6a7', fala: 'Vamos dar os primeiros passos!', estrelasNecessarias: 0 },
    { id: 'pig', nome: 'Pig', icone: '🐷', imagem: '/personagens/pig.png', posX: '50%', posY: '0%', corFundo: '#f48fb1', fala: 'Programar é uma grande aventura!', estrelasNecessarias: 0 },
    { id: 'green-dog', nome: 'Green Dog', icone: '🐸', imagem: '/personagens/green-dog.png', posX: '100%', posY: '0%', corFundo: '#90caf9', fala: 'Coloque o fone e vamos codar!', estrelasNecessarias: 0 },
    { id: 'puppy', nome: 'Puppy', icone: '🐶', imagem: '/personagens/puppy.png', posX: '0%', posY: '100%', corFundo: '#ffe082', fala: 'Qual é o próximo comando?', estrelasNecessarias: 3 },
    { id: 'duck', nome: 'Space Duck', icone: '🐦', imagem: '/personagens/duck.png', posX: '50%', posY: '100%', corFundo: '#81d4fa', fala: 'Vamos codar?', estrelasNecessarias: 5 },
    { id: 'fox', nome: 'Fox', icone: '🦊', imagem: '/personagens/fox.png', posX: '100%', posY: '100%', corFundo: '#ce93d8', fala: 'Você já domina as funções!', estrelasNecessarias: 8 }
  ];

  private fasesPadrao: FaseMapa[] = [
    { faseId: 1, id: 1, nivel: 1, subtitulo: 'FASE 01', titulo: 'Primeiros passos', etapaNome: 'Iniciante', tipo: 'digitacao', nivelId: 1, nivelOrdem: 1, nivelTitulo: 'Iniciante', ordem: 1, status: 'liberada', melhorEstrelas: 4, estrelas: 4, corCard: 'verde', mascoteIcone: '🐻‍❄️', videoClasse: 'vid-pos-1', posX: '0%', posY: '0%' },
    { faseId: 2, id: 2, nivel: 1, subtitulo: 'FASE 02', titulo: 'Comandos', etapaNome: 'Comandos', tipo: 'mouse', nivelId: 1, nivelOrdem: 2, nivelTitulo: 'Comandos', ordem: 2, status: 'liberada', melhorEstrelas: 2, estrelas: 2, corCard: 'azul', mascoteIcone: '🐦', videoClasse: 'vid-pos-2', posX: '50%', posY: '100%' },
    { faseId: 3, id: 3, nivel: 1, subtitulo: 'FASE 03', titulo: 'Loops', etapaNome: 'Loops', tipo: 'logica', nivelId: 1, nivelOrdem: 3, nivelTitulo: 'Loops', ordem: 3, status: 'bloqueada', melhorEstrelas: 0, estrelas: 0, corCard: 'roxo', mascoteIcone: '🐸', videoClasse: 'vid-pos-3', posX: '100%', posY: '0%' },
    { faseId: 4, id: 4, nivel: 2, subtitulo: 'FASE 04', titulo: 'Funções', etapaNome: 'Funções', tipo: 'logica', nivelId: 2, nivelOrdem: 4, nivelTitulo: 'Funções', ordem: 4, status: 'bloqueada', melhorEstrelas: 0, estrelas: 0, corCard: 'rosa', mascoteIcone: '🦊', videoClasse: 'vid-pos-4', posX: '100%', posY: '100%' },
    { faseId: 5, id: 5, nivel: 2, subtitulo: 'FASE 05', titulo: 'Projetos Finais', etapaNome: 'Projetos', tipo: 'digitacao', nivelId: 2, nivelOrdem: 5, nivelTitulo: 'Projetos', ordem: 5, status: 'bloqueada', melhorEstrelas: 0, estrelas: 0, corCard: 'laranja', mascoteIcone: '🐶', videoClasse: 'vid-pos-5', posX: '0%', posY: '100%' }
  ];

  private alunosPadrao: AlunoSessao[] = [
    { id: 1, nome: 'Ana Clara', idade: 6, nivelAtual: 2, cargoNivel: 'Explorador', estrelasTotal: 5, pontos: 1250, fasesConcluidas: 8, progressoPct: 80, ativo: true, personagem: this.personagens[3] },
    { id: 2, nome: 'Lucas Silva', idade: 7, nivelAtual: 2, cargoNivel: 'Programador', estrelasTotal: 4, pontos: 1120, fasesConcluidas: 8, progressoPct: 60, ativo: true, personagem: this.personagens[2] },
    { id: 3, nome: 'Maria Eduarda', idade: 5, nivelAtual: 1, cargoNivel: 'Iniciante', estrelasTotal: 4, pontos: 980, fasesConcluidas: 5, progressoPct: 40, ativo: true, personagem: this.personagens[1] },
    { id: 4, nome: 'Pedro Henrique', idade: 8, nivelAtual: 3, cargoNivel: 'Avançado', estrelasTotal: 4, pontos: 870, fasesConcluidas: 9, progressoPct: 90, ativo: true, personagem: this.personagens[2] },
    { id: 5, nome: 'Juliana Souza', idade: 6, nivelAtual: 2, cargoNivel: 'Explorador', estrelasTotal: 4, pontos: 760, fasesConcluidas: 7, progressoPct: 70, ativo: true, personagem: this.personagens[1] }
  ];

  constructor(private http: HttpClient) {}

  // 3.1 GET /api/sessoes/aberta
  verificarSessaoAberta(): Observable<{ aberta: boolean; sessao?: any; turma: string }> {
    return this.http.get<any>(`${this.apiUrl}/sessoes/aberta`).pipe(
      map(res => {
        const sessao = res?.sessao || res;
        const aberta = Boolean(sessao && sessao.id && sessao.status === 'ABERTA');
        if (this.isBrowser) {
          sessionStorage.setItem('cb_sessao_aberta', String(aberta));
          if (sessao?.id) {
            sessionStorage.setItem('cb_sessao_id', String(sessao.id));
          }
        }
        this.sessaoAbertaLocal = aberta;
        return {
          aberta,
          sessao,
          turma: sessao?.turma?.nome || 'Turma CodeBuddies'
        };
      }),
      catchError(() => {
        if (this.isBrowser) {
          const salvo = sessionStorage.getItem('cb_sessao_aberta');
          if (salvo !== null) {
            this.sessaoAbertaLocal = salvo === 'true';
          }
        }
        return of({
          aberta: this.sessaoAbertaLocal,
          turma: 'Turma CodeBuddies'
        });
      })
    );
  }

  // 3.2 POST /api/auth/aluno/entrar
  entrarNaSessao(nome: string, idade: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/aluno/entrar`, { nome, idade }).pipe(
      tap(res => {
        if (this.isBrowser) {
          if (res?.token) sessionStorage.setItem('cb_token_aluno', res.token);
          if (res?.sessao?.id) sessionStorage.setItem('cb_sessao_id', String(res.sessao.id));
          const perfil = {
            id: res?.aluno?.id || 1,
            nome: res?.aluno?.nome || nome,
            idade: res?.aluno?.idade || idade,
            novo: res?.novo ?? true,
            personagem: this.personagens[0]
          };
          sessionStorage.setItem('cb_aluno_logado', JSON.stringify(perfil));
        }
      }),
      catchError(err => {
        if (err?.error?.error?.code) {
          throw err;
        }
        const perfil = { id: 1, nome, idade, novo: true, personagem: this.personagens[0] };
        if (this.isBrowser) {
          sessionStorage.setItem('cb_aluno_logado', JSON.stringify(perfil));
          sessionStorage.setItem('cb_token_aluno', 'mock-token');
        }
        return of({ token: 'mock-token', aluno: perfil, sessao: { id: 1 }, novo: true });
      })
    );
  }

  // 3.3 GET /api/jogo/mapa
  carregarMapaDoJogo(): Observable<{
    fases: FaseMapa[];
    nivelAtual: number;
    estrelasTotais: number;
    fasesConcluidas: number;
    todasConcluidas: boolean;
  }> {
    const cores: ('verde' | 'azul' | 'roxo' | 'rosa' | 'laranja')[] = ['verde', 'azul', 'roxo', 'rosa', 'laranja'];
    const sprites = [
      { posX: '0%', posY: '0%', videoClasse: 'vid-pos-1' },
      { posX: '50%', posY: '100%', videoClasse: 'vid-pos-2' },
      { posX: '100%', posY: '0%', videoClasse: 'vid-pos-3' },
      { posX: '100%', posY: '100%', videoClasse: 'vid-pos-4' },
      { posX: '0%', posY: '100%', videoClasse: 'vid-pos-5' }
    ];

    return this.http.get<any>(`${this.apiUrl}/jogo/mapa`).pipe(
      map(res => {
        const fasesMapeadas: FaseMapa[] = (res.fases || []).map((f: any, idx: number) => ({
          faseId: f.faseId,
          id: f.faseId,
          nivel: f.nivelOrdem || 1,
          subtitulo: `FASE 0${idx + 1}`,
          titulo: f.titulo,
          etapaNome: f.nivelTitulo || f.titulo,
          tipo: (f.tipo || 'DIGITACAO').toLowerCase(),
          nivelId: f.nivelId,
          nivelOrdem: f.nivelOrdem,
          nivelTitulo: f.nivelTitulo,
          ordem: f.ordem,
          status: (f.status || 'LIBERADA').toLowerCase(),
          melhorEstrelas: f.melhorEstrelas || 0,
          estrelas: f.melhorEstrelas || 0,
          corCard: cores[idx % cores.length],
          videoClasse: sprites[idx % sprites.length].videoClasse,
          posX: sprites[idx % sprites.length].posX,
          posY: sprites[idx % sprites.length].posY
        }));
        if (fasesMapeadas.length) {
          this.fasesPadrao = fasesMapeadas;
        }
        return {
          fases: this.fasesPadrao,
          nivelAtual: res.nivelAtual ?? 1,
          estrelasTotais: res.estrelasTotais ?? 245,
          fasesConcluidas: res.fasesConcluidas ?? 8,
          todasConcluidas: Boolean(res.todasConcluidas)
        };
      }),
      catchError(() => of({
        fases: this.fasesPadrao,
        nivelAtual: 1,
        estrelasTotais: this.obterTotalEstrelas(),
        fasesConcluidas: 8,
        todasConcluidas: false
      }))
    );
  }

  // 3.4 Passo 1: GET /api/jogo/fases/:faseId
  obterFaseComDesafios(faseId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/jogo/fases/${faseId}`).pipe(
      catchError(err => {
        if (err?.error?.error?.code) throw err;
        return of({
          fase: { id: faseId, titulo: `Fase 0${faseId}`, tipo: 'DIGITACAO', ordem: faseId },
          desafios: [
            { id: 1, faseId, ordem: 1, enunciado: 'Pressione a tecla com a primeira letra da palavra BOLA', pontos: 150, opcoes: ['B', 'G', 'M', 'P'] },
            { id: 2, faseId, ordem: 2, enunciado: 'Pressione a tecla com a primeira letra da palavra GATO', pontos: 100, opcoes: ['C', 'G', 'T', 'L'] },
            { id: 3, faseId, ordem: 3, enunciado: 'Pressione a tecla com a primeira letra da palavra SAPO', pontos: 100, opcoes: ['S', 'R', 'F', 'V'] },
            { id: 4, faseId, ordem: 4, enunciado: 'Pressione a tecla com a primeira letra da palavra DADO', pontos: 100, opcoes: ['B', 'D', 'T', 'Q'] }
          ],
          totalDesafios: 4,
          pontosPossiveis: 450
        });
      })
    );
  }

  // 3.4 Passo 3: POST /api/jogo/fases/:faseId/respostas
  enviarRespostasFase(faseId: number, tempoSegundos: number, respostas: { desafioId: number; resposta: string }[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/jogo/fases/${faseId}/respostas`, {
      tempoSegundos,
      respostas
    }).pipe(
      catchError(() => {
        const acertos = respostas.filter(r => r.resposta && r.resposta.trim() !== '').length;
        const estrelas = Math.max(1, Math.min(5, acertos + 1));
        const aprovada = estrelas >= 3;
        this.salvarResultadoFase(faseId, estrelas);
        return of({
          estrelas,
          percentual: Math.round((estrelas / 5) * 100),
          pontos: estrelas * 100,
          pontosPossiveis: 500,
          acertos,
          erros: Math.max(0, 4 - acertos),
          desafios: respostas.map((r, i) => ({ desafioId: r.desafioId, ordem: i + 1, acertou: true, pontos: 100 })),
          aprovada,
          melhorEstrelas: estrelas,
          novoRecorde: true,
          proximaFaseId: faseId < 5 ? faseId + 1 : null,
          nivelAtual: 1,
          estrelasTotais: this.obterTotalEstrelas(),
          novasConquistas: estrelas >= 4 ? [
            { codigo: 'PRIMEIRA_FASE', icone: '🌟', titulo: 'Primeira estrela', descricao: 'Concluiu a fase brilhando!', conquistada: true }
          ] : []
        });
      })
    );
  }

  // 3.5 GET /api/jogo/conquistas
  carregarConquistas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/jogo/conquistas`).pipe(
      catchError(() => of({
        estrelasTotais: 245,
        pontosTotais: 1280,
        fasesConcluidas: 8,
        totalFases: 10,
        totalConquistadas: 3,
        conquistas: [
          { codigo: 'PRIMEIRA_FASE', icone: '🌟', titulo: 'Primeira Estrela', descricao: 'Concluiu a primeira fase.', conquistada: true },
          { codigo: 'CINCO_ESTRELAS', icone: '🏆', titulo: 'Perfeição', descricao: 'Ganhou 5 estrelas em uma fase.', conquistada: true },
          { codigo: 'EXPLORADOR', icone: '🚀', titulo: 'Explorador', descricao: 'Avançou na trilha de comandos.', conquistada: true },
          { codigo: 'MESTRE_LOOPS', icone: '🔁', titulo: 'Mestre dos Loops', descricao: 'Dominou repetições.', conquistada: false }
        ]
      }))
    );
  }

  // 3.6 GET /api/sessoes/:sessaoId/ranking
  carregarRankingDaSessao(sessaoId?: number): Observable<{ disponivel: boolean; mensagem?: string; itens: AlunoSessao[] }> {
    const id = sessaoId || (this.isBrowser ? Number(sessionStorage.getItem('cb_sessao_id') || 1) : 1);
    return this.http.get<any>(`${this.apiUrl}/sessoes/${id}/ranking`).pipe(
      map(res => ({
        disponivel: true,
        itens: (res.itens || []).map((item: any, idx: number) => ({
          id: item.alunoId || idx + 1,
          nome: item.nome,
          idade: 7,
          nivelAtual: item.nivelAlcancado || 1,
          cargoNivel: 'Explorador',
          estrelasTotal: item.estrelasNaSessao || 4,
          pontos: (item.estrelasNaSessao || 4) * 250,
          fasesConcluidas: item.fasesConcluidasNaSessao || 3,
          progressoPct: 80,
          ativo: true,
          personagem: this.personagens[idx % this.personagens.length]
        }))
      })),
      catchError(err => {
        if (err?.error?.error?.code === 'RANKING_INDISPONIVEL') {
          return of({
            disponivel: false,
            mensagem: err.error.error.message || 'O ranking aparece quando o professor encerrar a aula',
            itens: []
          });
        }
        return of({
          disponivel: true,
          itens: this.obterRanking()
        });
      })
    );
  }

  // 4. Login do Professor: POST /api/auth/professor/login
  loginProfessor(email: string, senha: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/professor/login`, { email, senha }).pipe(
      tap(res => {
        if (this.isBrowser && res?.token) {
          sessionStorage.setItem('cb_token_professor', res.token);
        }
      })
    );
  }

  // 4. Abrir Sessão de Aula
  abrirSessao(nomeTurma: string = 'Turma CodeBuddies'): Observable<any> {
    this.sessaoAbertaLocal = true;
    if (this.isBrowser) {
      sessionStorage.setItem('cb_sessao_aberta', 'true');
    }

    return this.http.get<any>(`${this.apiUrl}/turmas`).pipe(
      map(res => {
        const lista = Array.isArray(res) ? res : (res?.turmas || res?.itens || []);
        return lista[0]?.id || 1;
      }),
      catchError(() => of(1)),
      tap((turmaId: number) => {
        this.http.post<any>(`${this.apiUrl}/sessoes`, { turmaId }).pipe(
          tap(sessaoCriada => {
            const id = sessaoCriada?.id || sessaoCriada?.sessao?.id || 1;
            if (this.isBrowser) sessionStorage.setItem('cb_sessao_id', String(id));
            this.http.post(`${this.apiUrl}/sessoes/${id}/abrir`, {}).pipe(catchError(() => of(null))).subscribe();
          }),
          catchError(() => of(null))
        ).subscribe();
      })
    );
  }

  // 4. Encerrar Sessão de Aula
  encerrarSessao(): Observable<any> {
    this.sessaoAbertaLocal = false;
    if (this.isBrowser) {
      sessionStorage.setItem('cb_sessao_aberta', 'false');
    }
    const sessaoId = this.isBrowser ? Number(sessionStorage.getItem('cb_sessao_id') || 1) : 1;
    return this.http.post(`${this.apiUrl}/sessoes/${sessaoId}/encerrar`, {}).pipe(
      catchError(() => of({ encerrada: true }))
    );
  }

  obterAlunoLogado(): any {
    if (!this.isBrowser) return null;
    const salvo = sessionStorage.getItem('cb_aluno_logado');
    return salvo ? JSON.parse(salvo) : null;
  }

  salvarPersonagemEscolhido(personagem: Personagem): void {
    if (!this.isBrowser) return;
    const aluno = this.obterAlunoLogado() || { id: 1, nome: 'Ana Clara', idade: 6 };
    aluno.personagem = personagem;
    sessionStorage.setItem('cb_aluno_logado', JSON.stringify(aluno));
  }

  selecionarPersonagem(personagem: Personagem): void {
    this.salvarPersonagemEscolhido(personagem);
  }

  obterFases(): FaseMapa[] {
    return this.fasesPadrao;
  }

  obterTotalEstrelas(): number {
    const soma = this.fasesPadrao.reduce((acc, f) => acc + (f.melhorEstrelas || f.estrelas || 0), 0);
    return soma > 6 ? soma : 245;
  }

  obterTotalPontos(): number {
    return this.obterTotalEstrelas() * 210;
  }

  obterHistorico(): { faseTitulo: string; estrelas: number; data: string }[] {
    return [];
  }

  salvarResultadoFase(idFase: number, estrelasObtidas: number): void {
    const idx = this.fasesPadrao.findIndex(f => f.faseId === idFase || f.id === idFase);
    if (idx !== -1) {
      if (estrelasObtidas > this.fasesPadrao[idx].melhorEstrelas) {
        this.fasesPadrao[idx].melhorEstrelas = estrelasObtidas;
        this.fasesPadrao[idx].estrelas = estrelasObtidas;
      }
      if (this.fasesPadrao[idx].melhorEstrelas >= 3) {
        this.fasesPadrao[idx].status = 'concluida';
        if (this.fasesPadrao[idx + 1] && (this.fasesPadrao[idx + 1].status === 'bloqueada' || this.fasesPadrao[idx + 1].status === 'BLOQUEADA')) {
          this.fasesPadrao[idx + 1].status = 'liberada';
        }
      }
    }
  }

  obterAlunosDaSessao(): AlunoSessao[] {
    return this.alunosPadrao;
  }

  obterRanking(): AlunoSessao[] {
    return [...this.alunosPadrao].sort((a, b) => b.pontos - a.pontos);
  }

  alternarStatusAluno(id: number): void {
    const aluno = this.alunosPadrao.find(a => a.id === id);
    if (aluno) {
      aluno.ativo = !aluno.ativo;
      const endpoint = aluno.ativo ? 'reativar' : 'desativar';
      this.http.post(`${this.apiUrl}/alunos/${id}/${endpoint}`, {}).pipe(catchError(() => of(null))).subscribe();
    }
  }
}
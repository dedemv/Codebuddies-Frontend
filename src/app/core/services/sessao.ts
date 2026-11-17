import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';

export type Perfil = 'ALUNO' | 'PROFESSOR';
export type StatusSessao = 'CRIADA' | 'ABERTA' | 'ENCERRADA';
export type StatusAluno = 'ATIVO' | 'DESATIVADO';
export type TipoFaseApi = 'DIGITACAO' | 'LOGICA' | 'COMPUTACAO_BASICA';
export type StatusFaseApi = 'BLOQUEADA' | 'LIBERADA' | 'CONCLUIDA';

export interface Personagem {
  id: string;
  nome: string;
  icone: string;
  imagem?: string;
  posX?: string;
  posY?: string;
  corFundo: string;
  fala: string;
  estrelasNecessarias: number;
}

export interface Fase {
  id: number;
  faseId?: number;
  nivel: number;
  nivelId?: number;
  nivelOrdem?: number;
  nivelTitulo?: string;
  ordem?: number;
  subtitulo: string;
  titulo: string;
  etapaNome: string;
  corCard: string;
  mascoteIcone: string;
  posX: string;
  posY: string;
  videoClasse: string;
  tipo: 'digitacao' | 'logica' | 'mouse' | TipoFaseApi;
  status: 'liberada' | 'bloqueada' | 'concluida' | StatusFaseApi;
  estrelas: number;
  melhorEstrelas?: number;
}

export interface DesafioJogo {
  id: number;
  faseId: number;
  ordem: number;
  enunciado: string;
  pontos: number;
  opcoes?: string[];
  dica?: string;
}

export interface AlunoSessao {
  id: number;
  turmaId?: number;
  nome: string;
  idade: number;
  personagem: Personagem;
  nivelAtual: number;
  cargoNivel: string;
  estrelasTotal: number;
  pontos: number;
  fasesConcluidas: number;
  progressoPct: number;
  ativo: boolean;
  status?: StatusAluno;
}

@Injectable({
  providedIn: 'root'
})
export class Sessao {
  public readonly apiUrl = 'http://localhost:3333/api';

  // Estado em memória para passagem A4 (Jogar) -> A5 (Resultado)
  public ultimoResultadoTentativa = signal<any | null>(null);

  // Mascotes visuais (extra preservado, isolado por alunoId no sessionStorage)
  public readonly personagens: Personagem[] = [
    { id: 'white-dog', nome: 'White Dog', icone: '🐻‍❄️', imagem: '/personagens/white-dog.png', posX: '0%', posY: '0%', corFundo: '#e3f2fd', fala: 'Vamos dar os primeiros passos!', estrelasNecessarias: 0 },
    { id: 'pig', nome: 'Pig', icone: '🐷', imagem: '/personagens/pig.png', posX: '50%', posY: '0%', corFundo: '#fce4ec', fala: 'Programar é muito divertido!', estrelasNecessarias: 0 },
    { id: 'green-dog', nome: 'Green Dog', icone: '🐸', imagem: '/personagens/green-dog.png', posX: '100%', posY: '0%', corFundo: '#e8f5e9', fala: 'Coloque o fone e vamos codar!', estrelasNecessarias: 0 },
    { id: 'puppy', nome: 'Puppy', icone: '🐶', imagem: '/personagens/puppy.png', posX: '0%', posY: '100%', corFundo: '#fff9c4', fala: 'Qual é o próximo comando?', estrelasNecessarias: 3 },
    { id: 'duck', nome: 'Space Duck', icone: '🐦', imagem: '/personagens/duck.png', posX: '50%', posY: '100%', corFundo: '#e1f5fe', fala: 'Explorando o universo dos códigos!', estrelasNecessarias: 5 },
    { id: 'fox', nome: 'Fox', icone: '🦊', imagem: '/personagens/fox.png', posX: '100%', posY: '100%', corFundo: '#fff3e0', fala: 'Você já domina as funções!', estrelasNecessarias: 8 }
  ];

  private totalEstrelasCache = 0;

  constructor(private http: HttpClient) {}

  public get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  }

  // ==========================================
  // 1. AUTENTICAÇÃO E SESSÃO (Seção 3 da Spec)
  // ==========================================

  get token(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem('token');
  }

  get perfil(): Perfil | null {
    if (!this.isBrowser) return null;
    return (sessionStorage.getItem('perfil') as Perfil) || null;
  }

  get sessaoId(): number | null {
    if (!this.isBrowser) return null;
    const raw = sessionStorage.getItem('sessaoId');
    return raw ? Number(raw) : null;
  }

  estaLogado(): boolean {
    return Boolean(this.token && this.perfil);
  }

  isAlunoLogado(): boolean {
    return this.estaLogado() && this.perfil === 'ALUNO';
  }

  isProfessorLogado(): boolean {
    return this.estaLogado() && this.perfil === 'PROFESSOR';
  }

  // POST /api/auth/aluno/entrar
  entrarNaSessao(nome: string, idade: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/aluno/entrar`, {
      nome: nome.trim(),
      idade: Number(idade)
    }).pipe(
      tap(res => {
        if (!this.isBrowser) return;
        // Limpa qualquer resquício de criança anterior no mesmo computador
        this.limparSessao();

        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('perfil', 'ALUNO');
        if (res.sessao?.id) {
          sessionStorage.setItem('sessaoId', String(res.sessao.id));
        }

        const personagemSalvo = this.obterPersonagemDoAluno(res.aluno.id);
        const dadosAluno = {
          ...res.aluno,
          personagem: personagemSalvo
        };
        sessionStorage.setItem('cb_usuario', JSON.stringify(dadosAluno));
      })
    );
  }

  // POST /api/auth/professor/login
  loginProfessor(email: string, senha: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/professor/login`, { email: email.trim(), senha }).pipe(
      tap(res => {
        if (!this.isBrowser) return;
        this.limparSessao();

        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('perfil', 'PROFESSOR');
        sessionStorage.setItem('cb_usuario', JSON.stringify(res.professor));
      })
    );
  }

  // GET /api/auth/eu
  carregarEu(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/eu`).pipe(
      tap(res => {
        if (!this.isBrowser) return;
        const atual = this.obterAlunoLogado();
        const usuario = res.aluno || res.professor || res;
        if (this.perfil === 'ALUNO' && usuario?.id) {
          usuario.personagem = atual?.personagem || this.obterPersonagemDoAluno(usuario.id);
        }
        sessionStorage.setItem('cb_usuario', JSON.stringify(usuario));
      })
    );
  }

  limparSessao(): void {
    if (!this.isBrowser) return;
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('perfil');
    sessionStorage.removeItem('sessaoId');
    sessionStorage.removeItem('cb_usuario');
    // Remove chaves antigas legadas para garantir que nada vaze
    sessionStorage.removeItem('cb_token_aluno');
    sessionStorage.removeItem('cb_token_professor');
    sessionStorage.removeItem('cb_prof_logado');
    sessionStorage.removeItem('cb_aluno_logado');
    sessionStorage.removeItem('cb_sessao_id');
    this.ultimoResultadoTentativa.set(null);
    this.totalEstrelasCache = 0;
  }

  logoutProfessor(): void {
    this.limparSessao();
  }

  sair(): void {
    this.limparSessao();
  }

  obterAlunoLogado(): any {
    if (!this.isBrowser || this.perfil !== 'ALUNO') return null;
    const salvo = sessionStorage.getItem('cb_usuario');
    if (!salvo) return null;
    try {
      const aluno = JSON.parse(salvo);
      if (!aluno.personagem) {
        aluno.personagem = this.obterPersonagemDoAluno(aluno.id);
      }
      return aluno;
    } catch {
      return null;
    }
  }

  obterProfessorLogado(): any {
    if (!this.isBrowser || this.perfil !== 'PROFESSOR') return null;
    const salvo = sessionStorage.getItem('cb_usuario');
    return salvo ? JSON.parse(salvo) : null;
  }

  // ==========================================
  // 2. PERSONAGEM / MASCOTE (Sem vazamento)
  // ==========================================

  private obterPersonagemDoAluno(alunoId: number): Personagem {
    if (!this.isBrowser || !alunoId) return this.personagens[0];
    const salvoId = sessionStorage.getItem(`cb_personagem_aluno_${alunoId}`);
    return this.personagens.find(p => p.id === salvoId) || this.personagens[0];
  }

  selecionarPersonagem(personagem: Personagem): void {
    if (!this.isBrowser) return;
    const aluno = this.obterAlunoLogado();
    if (!aluno?.id) return;

    aluno.personagem = personagem;
    sessionStorage.setItem(`cb_personagem_aluno_${aluno.id}`, personagem.id);
    sessionStorage.setItem('cb_usuario', JSON.stringify(aluno));
  }

  obterTotalEstrelas(): number {
    return this.totalEstrelasCache;
  }

  // ==========================================
  // 3. JOGO DO ALUNO (A2, A3, A4, A5, A6)
  // ==========================================

  // GET /api/jogo/mapa
  carregarMapaDoJogo(): Observable<{
    fases: Fase[];
    nivelAtual: number;
    estrelasTotais: number;
    fasesConcluidas: number;
    todasConcluidas: boolean;
  }> {
    const cores = ['verde', 'azul', 'roxo', 'rosa', 'laranja'];
    const icones = ['🐻‍❄️', '🐦', '🐸', '🦊', '🐶'];
    const posicoes = [
      { posX: '0%', posY: '0%', videoClasse: 'vid-pos-1' },
      { posX: '50%', posY: '100%', videoClasse: 'vid-pos-2' },
      { posX: '100%', posY: '0%', videoClasse: 'vid-pos-3' },
      { posX: '100%', posY: '100%', videoClasse: 'vid-pos-4' },
      { posX: '0%', posY: '100%', videoClasse: 'vid-pos-5' }
    ];

    return this.http.get<any>(`${this.apiUrl}/jogo/mapa`).pipe(
      map(res => {
        this.totalEstrelasCache = res.estrelasTotais ?? 0;
        const fasesMapeadas: Fase[] = (res.fases || []).map((f: any, idx: number) => {
          const statusNormalizado =
            f.status === 'CONCLUIDA' ? 'concluida' :
            f.status === 'LIBERADA' ? 'liberada' : 'bloqueada';

          const tipoNormalizado =
            f.tipo === 'DIGITACAO' ? 'digitacao' :
            f.tipo === 'COMPUTACAO_BASICA' ? 'mouse' : 'logica';

          const pos = posicoes[idx % posicoes.length];
          return {
            id: f.faseId ?? f.id,
            faseId: f.faseId ?? f.id,
            nivel: f.nivelOrdem ?? 1,
            nivelId: f.nivelId,
            nivelOrdem: f.nivelOrdem ?? 1,
            nivelTitulo: f.nivelTitulo ?? `Nível ${f.nivelOrdem ?? 1}`,
            ordem: f.ordem ?? idx + 1,
            subtitulo: `FASE ${String(f.ordem ?? idx + 1).padStart(2, '0')}`,
            titulo: f.titulo,
            etapaNome: f.nivelTitulo ?? 'Aventura',
            corCard: cores[idx % cores.length],
            mascoteIcone: icones[idx % icones.length],
            posX: pos.posX,
            posY: pos.posY,
            videoClasse: pos.videoClasse,
            tipo: tipoNormalizado,
            status: statusNormalizado,
            estrelas: f.melhorEstrelas ?? 0,
            melhorEstrelas: f.melhorEstrelas ?? 0
          };
        });

        return {
          fases: fasesMapeadas,
          nivelAtual: res.nivelAtual ?? 1,
          estrelasTotais: res.estrelasTotais ?? 0,
          fasesConcluidas: res.fasesConcluidas ?? 0,
          todasConcluidas: Boolean(res.todasConcluidas)
        };
      })
    );
  }

  obterMapaFases(): Observable<Fase[]> {
    return this.carregarMapaDoJogo().pipe(map(m => m.fases));
  }

  // GET /api/jogo/fases/:id (Sem respostaCorreta!)
  obterFaseComDesafios(faseId: number): Observable<{
    fase: any;
    desafios: DesafioJogo[];
    totalDesafios: number;
    pontosPossiveis: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/jogo/fases/${faseId}`).pipe(
      map(res => {
        const desafios: DesafioJogo[] = (res.desafios || []).map((d: any) => ({
          id: d.id,
          faseId: d.faseId ?? faseId,
          ordem: d.ordem,
          enunciado: d.enunciado,
          pontos: d.pontos,
          opcoes: this.extrairOpcoesDoEnunciado(d.enunciado)
        }));
        return {
          fase: res.fase,
          desafios,
          totalDesafios: res.totalDesafios ?? desafios.length,
          pontosPossiveis: res.pontosPossiveis ?? 0
        };
      })
    );
  }

  // Extrai opções entre parênteses sugeridas na Seção 5 (A4), ex: "(LUZ ou TV)" -> ['LUZ', 'TV']
  private extrairOpcoesDoEnunciado(enunciado: string): string[] {
    const match = enunciado?.match(/\(([^)]+)\)/);
    if (!match || !match[1]) return [];
    const partes = match[1]
      .split(/\s+ou\s+|,|\/|\s+e\s+/i)
      .map(s => s.trim())
      .filter(Boolean);
    return partes.length >= 2 ? partes : [];
  }

  // POST /api/jogo/fases/:id/respostas (Quem corrige e calcula estrelas é o back!)
  enviarRespostasFase(
    faseId: number,
    tempoSegundos: number,
    respostas: { desafioId: number; resposta: string }[]
  ): Observable<any> {
    const payload = {
      tempoSegundos: Math.max(1, Math.round(tempoSegundos)),
      respostas: respostas.map(r => ({ desafioId: r.desafioId, resposta: String(r.resposta) }))
    };
    return this.http.post<any>(`${this.apiUrl}/jogo/fases/${faseId}/respostas`, payload).pipe(
      tap(resultado => {
        this.ultimoResultadoTentativa.set({ faseId, ...resultado });
        if (resultado?.estrelasTotais !== undefined) {
          this.totalEstrelasCache = resultado.estrelasTotais;
        }
      })
    );
  }

  // GET /api/jogo/conquistas
  carregarConquistas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/jogo/conquistas`).pipe(
      tap(res => {
        if (res?.estrelasTotais !== undefined) {
          this.totalEstrelasCache = res.estrelasTotais;
        }
      })
    );
  }

  // ==========================================
  // 4. SESSÕES / AULAS E RANKING (A1, A7, P2, P4, P9)
  // ==========================================

  // GET /api/sessoes/aberta
  verificarSessaoAberta(): Observable<{ aberta: boolean; sessao: any | null; turma: string }> {
    return this.http.get<any>(`${this.apiUrl}/sessoes/aberta`).pipe(
      map(res => {
        const sessao = res?.sessao !== undefined ? res.sessao : (res?.id ? res : null);
        const aberta = Boolean(sessao && (sessao.status === 'ABERTA' || res?.aberta === true));
        return {
          aberta,
          sessao,
          turma: sessao?.turmaNome || sessao?.turma?.nome || ''
        };
      })
    );
  }

  listarSessoes(filtros?: { turmaId?: number; status?: StatusSessao }): Observable<any[]> {
    let params = new HttpParams();
    if (filtros?.turmaId) params = params.set('turmaId', String(filtros.turmaId));
    if (filtros?.status) params = params.set('status', filtros.status);
    return this.http.get<any>(`${this.apiUrl}/sessoes`, { params }).pipe(
      map(res => (Array.isArray(res) ? res : res?.sessoes || res?.itens || []))
    );
  }

  obterSessaoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/sessoes/${id}`);
  }

  listarAlunosDaSessao(sessaoId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/sessoes/${sessaoId}/alunos`).pipe(
      map(res => (Array.isArray(res) ? res : res?.alunos || res?.itens || []))
    );
  }

  criarSessao(turmaId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sessoes`, { turmaId });
  }

  abrirSessaoPorId(sessaoId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sessoes/${sessaoId}/abrir`, {});
  }

  encerrarSessaoPorId(sessaoId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sessoes/${sessaoId}/encerrar`, {});
  }

  // GET /api/sessoes/:sessaoId/ranking (Mostra estrelasNaSessao!)
  carregarRankingDaSessao(sessaoId?: number): Observable<{
    disponivel: boolean;
    mensagem?: string;
    sessaoId?: number;
    geradoEm?: string;
    itens: any[];
  }> {
    const id = sessaoId ?? this.sessaoId;
    if (!id) {
      return new Observable(obs => {
        obs.next({ disponivel: false, mensagem: 'Nenhuma aula selecionada.', itens: [] });
        obs.complete();
      });
    }

    return this.http.get<any>(`${this.apiUrl}/sessoes/${id}/ranking`).pipe(
      map(res => ({
        disponivel: true,
        sessaoId: res.sessaoId ?? id,
        geradoEm: res.geradoEm,
        itens: (res.itens || []).map((item: any, idx: number) => ({
          posicao: item.posicao ?? idx + 1,
          id: item.alunoId,
          alunoId: item.alunoId,
          nome: item.nome,
          nivelAtual: item.nivelAlcancado ?? 1,
          nivelAlcancado: item.nivelAlcancado ?? 1,
          estrelasNaSessao: item.estrelasNaSessao ?? 0,
          estrelasTotal: item.estrelasNaSessao ?? 0,
          fasesConcluidas: item.fasesConcluidasNaSessao ?? 0,
          tempoTotalSegundos: item.tempoTotalSegundos ?? 0,
          personagem: this.personagens[idx % this.personagens.length]
        }))
      }))
    );
  }

  // ==========================================
  // 5. TURMAS, ALUNOS, CONTEÚDO, RELATÓRIOS E PROFESSORES (P3 a P10)
  // ==========================================

  listarTurmas(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/turmas`).pipe(
      map(res => (Array.isArray(res) ? res : res?.turmas || res?.itens || []))
    );
  }

  criarTurma(nome: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/turmas`, { nome: nome.trim() });
  }

  atualizarTurma(id: number, dados: { nome?: string; ativa?: boolean }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/turmas/${id}`, dados);
  }

  listarAlunosDaTurma(turmaId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/turmas/${turmaId}/alunos`).pipe(
      map(res => (Array.isArray(res) ? res : res?.alunos || res?.itens || []))
    );
  }

  obterAlunoPorId(alunoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/alunos/${alunoId}`);
  }

  obterMapaDoAluno(alunoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/alunos/${alunoId}/mapa`);
  }

  obterConquistasDoAluno(alunoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/alunos/${alunoId}/conquistas`);
  }

  editarAluno(alunoId: number, dados: { nome?: string; idade?: number }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/alunos/${alunoId}`, dados);
  }

  desativarAluno(alunoId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/alunos/${alunoId}/desativar`, {});
  }

  reativarAluno(alunoId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/alunos/${alunoId}/reativar`, {});
  }

  // P7 Conteúdo
  listarNiveis(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/niveis`).pipe(
      map(res => (Array.isArray(res) ? res : res?.niveis || []))
    );
  }

  criarNivel(dados: { titulo: string; descricao?: string; ordem?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/niveis`, dados);
  }

  atualizarNivel(id: number, dados: { titulo?: string; descricao?: string; ordem?: number }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/niveis/${id}`, dados);
  }

  excluirNivel(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/niveis/${id}`);
  }

  listarFasesProfessor(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/fases`).pipe(
      map(res => (Array.isArray(res) ? res : res?.fases || []))
    );
  }

  obterFaseProfessor(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/fases/${id}`);
  }

  criarFase(dados: { nivelId: number; titulo: string; tipo: TipoFaseApi; ordem?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/fases`, dados);
  }

  atualizarFase(id: number, dados: { nivelId?: number; ordem?: number; titulo?: string; tipo?: TipoFaseApi }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/fases/${id}`, dados);
  }

  excluirFase(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/fases/${id}`);
  }

  criarDesafio(faseId: number, dados: { enunciado: string; respostaCorreta: string; pontos?: number; ordem?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/fases/${faseId}/desafios`, dados);
  }

  atualizarDesafio(id: number, dados: { enunciado?: string; respostaCorreta?: string; pontos?: number; ordem?: number }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/desafios/${id}`, dados);
  }

  excluirDesafio(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/desafios/${id}`);
  }

  // P8 Relatórios
  obterRelatorioResumo(turmaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/relatorios/turmas/${turmaId}/resumo`);
  }

  obterRelatorioFases(turmaId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/relatorios/turmas/${turmaId}/fases`).pipe(
      map(res => (Array.isArray(res) ? res : res?.fases || []))
    );
  }

  obterRelatorioBoletim(turmaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/relatorios/turmas/${turmaId}/boletim`);
  }

  obterDesafiosMaisErrados(turmaId: number, limite = 5): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/relatorios/turmas/${turmaId}/desafios-mais-errados?limite=${limite}`).pipe(
      map(res => (Array.isArray(res) ? res : res?.desafios || res?.itens || []))
    );
  }

  // P10 Professores
  listarProfessores(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/professores`).pipe(
      map(res => (Array.isArray(res) ? res : res?.professores || []))
    );
  }

  criarProfessor(dados: { nome: string; email: string; senha: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/professores`, dados);
  }

  atualizarProfessor(id: number, dados: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/professores/${id}`, dados);
  }
}
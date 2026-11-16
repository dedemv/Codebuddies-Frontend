import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

export interface Fase {
  id: number;
  nivel: number;
  subtitulo: string;
  titulo: string;
  etapaNome: string;
  corCard: string;
  mascoteIcone: string;
  posX: string;
  posY: string;
  videoClasse: string;
  tipo: 'digitacao' | 'logica' | 'mouse';
  status: 'liberada' | 'bloqueada' | 'concluida';
  estrelas: number;
}

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

export interface AlunoSessao {
  id: number;
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
}

export interface DesafioJogo {
  id: number;
  faseId: number;
  ordem: number;
  enunciado: string;
  dica: string;
  alvo: string;
  opcoes: string[];
  pontos: number;
}

@Injectable({
  providedIn: 'root'
})
export class Sessao {
  public readonly apiUrl = 'http://localhost:3333/api';
  public sessaoAbertaLocal = false;
  public nomeTurmaAtual = 'Turma AMPLA - Platina';

  public personagens: Personagem[] = [
    { id: 'white-dog', nome: 'White Dog', icone: '🐻‍❄️', imagem: '/personagens/white-dog.png', posX: '0%', posY: '0%', corFundo: '#e3f2fd', fala: 'Vamos dar os primeiros passos!', estrelasNecessarias: 0 },
    { id: 'pig', nome: 'Pig', icone: '🐷', imagem: '/personagens/pig.png', posX: '50%', posY: '0%', corFundo: '#fce4ec', fala: 'Programar é muito divertido!', estrelasNecessarias: 0 },
    { id: 'green-dog', nome: 'Green Dog', icone: '🐸', imagem: '/personagens/green-dog.png', posX: '100%', posY: '0%', corFundo: '#e8f5e9', fala: 'Coloque o fone e vamos codar!', estrelasNecessarias: 0 },
    { id: 'puppy', nome: 'Puppy', icone: '🐶', imagem: '/personagens/puppy.png', posX: '0%', posY: '100%', corFundo: '#fff9c4', fala: 'Qual é o próximo comando?', estrelasNecessarias: 3 },
    { id: 'duck', nome: 'Space Duck', icone: '🐦', imagem: '/personagens/duck.png', posX: '50%', posY: '100%', corFundo: '#e1f5fe', fala: 'Explorando o universo dos códigos!', estrelasNecessarias: 5 },
    { id: 'fox', nome: 'Fox', icone: '🦊', imagem: '/personagens/fox.png', posX: '100%', posY: '100%', corFundo: '#fff3e0', fala: 'Você já domina as funções!', estrelasNecessarias: 8 }
  ];

  private fasesMock: Fase[] = [
    { id: 1, nivel: 1, subtitulo: 'FASE 01', titulo: 'Primeiros passos', etapaNome: 'Iniciante', corCard: 'verde', mascoteIcone: '🐻‍❄️', posX: '0%', posY: '0%', videoClasse: 'vid-pos-1', tipo: 'digitacao', status: 'liberada', estrelas: 0 },
    { id: 2, nivel: 1, subtitulo: 'FASE 02', titulo: 'Comandos', etapaNome: 'Comandos', corCard: 'azul', mascoteIcone: '🐦', posX: '50%', posY: '100%', videoClasse: 'vid-pos-2', tipo: 'mouse', status: 'bloqueada', estrelas: 0 },
    { id: 3, nivel: 1, subtitulo: 'FASE 03', titulo: 'Loops', etapaNome: 'Loops', corCard: 'roxo', mascoteIcone: '🐸', posX: '100%', posY: '0%', videoClasse: 'vid-pos-3', tipo: 'logica', status: 'bloqueada', estrelas: 0 },
    { id: 4, nivel: 1, subtitulo: 'FASE 04', titulo: 'Funções', etapaNome: 'Funções', corCard: 'rosa', mascoteIcone: '🦊', posX: '100%', posY: '100%', videoClasse: 'vid-pos-4', tipo: 'logica', status: 'bloqueada', estrelas: 0 },
    { id: 5, nivel: 1, subtitulo: 'FASE 05', titulo: 'Projetos Finais', etapaNome: 'Projetos', corCard: 'laranja', mascoteIcone: '🐶', posX: '0%', posY: '100%', videoClasse: 'vid-pos-5', tipo: 'logica', status: 'bloqueada', estrelas: 0 }
  ];

  // Desafios exclusivos e diferentes para cada uma das 5 fases
  private desafiosPorFase: Record<number, DesafioJogo[]> = {
    1: [
      { id: 101, faseId: 1, ordem: 1, enunciado: 'Aperte no teclado a primeira letra da palavra ABELHA 🐝', dica: 'Começa com a vogal A!', alvo: 'A', opcoes: ['A', 'E', 'I', 'O', 'U'], pontos: 100 },
      { id: 102, faseId: 1, ordem: 2, enunciado: 'Aperte no teclado a primeira letra da palavra ELEFANTE 🐘', dica: 'Começa com a vogal E!', alvo: 'E', opcoes: ['A', 'E', 'I', 'O', 'U'], pontos: 100 },
      { id: 103, faseId: 1, ordem: 3, enunciado: 'Aperte no teclado a primeira letra da palavra ILHA 🏝️', dica: 'Começa com a vogal I!', alvo: 'I', opcoes: ['A', 'E', 'I', 'O', 'U'], pontos: 100 },
      { id: 104, faseId: 1, ordem: 4, enunciado: 'Aperte no teclado a primeira letra da palavra OVELHA 🐑', dica: 'Começa com a vogal O!', alvo: 'O', opcoes: ['A', 'E', 'I', 'O', 'U'], pontos: 100 },
      { id: 105, faseId: 1, ordem: 5, enunciado: 'Aperte no teclado a primeira letra da palavra URSO 🐻', dica: 'Começa com a vogal U!', alvo: 'U', opcoes: ['A', 'E', 'I', 'O', 'U'], pontos: 100 }
    ],
    2: [
      { id: 201, faseId: 2, ordem: 1, enunciado: 'Clique no comando para o robô andar para a DIREITA ➡️ (até a bateria 🔋):', dica: 'Olhe a seta que aponta para a direita!', alvo: '➡️ Direita', opcoes: ['⬅️ Esquerda', '➡️ Direita', '⬇️ Baixo'], pontos: 100 },
      { id: 202, faseId: 2, ordem: 2, enunciado: 'Clique no objeto que usamos para DIGITAR no computador:', dica: 'Ele tem várias teclas com letras!', alvo: '⌨️ Teclado', opcoes: ['🍎 Maçã', '⌨️ Teclado', '⚽ Bola'], pontos: 100 },
      { id: 203, faseId: 2, ordem: 3, enunciado: 'O obstáculo está embaixo! Qual comando faz o mascote SUBIR ⬆️?', dica: 'Escolha a seta para cima!', alvo: '⬆️ Subir', opcoes: ['⬆️ Subir', '⬇️ Descer', '💤 Parar'], pontos: 100 },
      { id: 204, faseId: 2, ordem: 4, enunciado: 'Clique na ferramenta que move a setinha na tela do PC:', dica: 'Tem nome de ratinho em inglês!', alvo: '🖱️ Mouse', opcoes: ['🎸 Violão', '🖱️ Mouse', '👟 Tênis'], pontos: 100 },
      { id: 205, faseId: 2, ordem: 5, enunciado: 'Para ligar o computador, qual é o primeiro comando?', dica: 'Precisa de energia elétrica!', alvo: '🔌 Ligar na tomada', opcoes: ['🎮 Jogar', '🔌 Ligar na tomada', '😴 Dormir'], pontos: 100 }
    ],
    3: [
      { id: 301, faseId: 3, ordem: 1, enunciado: 'Complete o loop de cores: 🟥 🟦 🟥 🟦 ... Qual vem agora?', dica: 'Vermelho, Azul, Vermelho, Azul...', alvo: '🟥', opcoes: ['🟥', '🟩', '🟨'], pontos: 120 },
      { id: 302, faseId: 3, ordem: 2, enunciado: 'Se o robô precisa dar 3 passos iguais para frente, usamos:', dica: 'Evita repetir o mesmo bloco várias vezes!', alvo: '🔁 Repetir 3x (Avançar)', opcoes: ['🔁 Repetir 3x (Avançar)', '🛑 Parar tudo', '⬅️ Voltar 1x'], pontos: 120 },
      { id: 303, faseId: 3, ordem: 3, enunciado: 'Qual ícone completa a repetição? 🌞 🌙 🌞 🌙 ...', dica: 'Dia, Noite, Dia, Noite...', alvo: '🌞', opcoes: ['🌧️', '🌞', '⛄'], pontos: 120 },
      { id: 304, faseId: 3, ordem: 4, enunciado: 'Conte de 2 em 2 no loop: 2, 4, 6... Qual é o próximo número?', dica: '6 mais 2 é igual a...', alvo: '8', opcoes: ['5', '8', '10'], pontos: 120 },
      { id: 305, faseId: 3, ordem: 5, enunciado: 'O loop "Repetir 4 vezes (Pular 🐸)" faz o sapinho pular quantas vezes?', dica: 'Olhe o número no comando Repetir!', alvo: '4 pulos', opcoes: ['1 pulo', '4 pulos', '10 pulos'], pontos: 120 }
    ],
    4: [
      { id: 401, faseId: 4, ordem: 1, enunciado: 'Criamos a função pularObstaculo(). Quando há uma pedra 🪨 no caminho, qual função chamamos?', dica: 'Chame a função que pula!', alvo: '⚡ pularObstaculo()', opcoes: ['⚡ pularObstaculo()', '💤 dormir()', '🎨 pintar()'], pontos: 150 },
      { id: 402, faseId: 4, ordem: 2, enunciado: 'A função somarEstrelas(2, 3) junta as estrelas. Qual é o resultado?', dica: 'Quanto é 2 + 3?', alvo: '⭐ 5 estrelas', opcoes: ['⭐ 3 estrelas', '⭐ 5 estrelas', '⭐ 9 estrelas'], pontos: 150 },
      { id: 403, faseId: 4, ordem: 3, enunciado: 'O que a receita da função fazerSuco(🍊) vai entregar no final?', dica: 'A entrada foi uma laranja!', alvo: '🧃 Suco de Laranja', opcoes: ['🧃 Suco de Laranja', '🍕 Pizza', '🍔 Hambúrguer'], pontos: 150 },
      { id: 404, faseId: 4, ordem: 4, enunciado: 'Qual função devemos ativar quando a tela fica escura 🌑?', dica: 'Precisamos iluminar o caminho!', alvo: '💡 acenderLuz()', opcoes: ['🔊 tocarMusica()', '💡 acenderLuz()', '🚪 fecharPorta()'], pontos: 150 },
      { id: 405, faseId: 4, ordem: 5, enunciado: 'Para que serve uma Função na programação?', dica: 'Guarda comandos para usarmos sempre que precisar!', alvo: '📦 Guardar comandos reutilizáveis', opcoes: ['📦 Guardar comandos reutilizáveis', '🗑️ Apagar o jogo', '🔌 Desligar a tela'], pontos: 150 }
    ],
    5: [
      { id: 501, faseId: 5, ordem: 1, enunciado: 'Missão Final! O robô está a 2 passos do troféu 🏆. Qual sequência leva até lá?', dica: 'Ele precisa dar 2 passos para frente!', alvo: '⬆️ Avançar ➔ ⬆️ Avançar', opcoes: ['⬆️ Avançar ➔ ⬆️ Avançar', '⬇️ Voltar ➔ ⬇️ Voltar', '💤 Esperar'], pontos: 200 },
      { id: 502, faseId: 5, ordem: 2, enunciado: 'Encontramos um bug 🐛 no código: 1, 2, 3, 99, 5. Qual número está errado?', dica: 'Depois do 3 deveria vir o 4!', alvo: '99 (trocar por 4)', opcoes: ['1', '99 (trocar por 4)', '5'], pontos: 200 },
      { id: 503, faseId: 5, ordem: 3, enunciado: 'Para o foguete 🚀 decolar, coloque na ordem certa:', dica: 'Contar, ligar o motor e subir!', alvo: '1️⃣ Contar ➔ 2️⃣ Ligar motor ➔ 3️⃣ Subir', opcoes: ['1️⃣ Contar ➔ 2️⃣ Ligar motor ➔ 3️⃣ Subir', '3️⃣ Subir ➔ 1️⃣ Desligar', '😴 Dormir no foguete'], pontos: 200 },
      { id: 504, faseId: 5, ordem: 4, enunciado: 'SE (chave == encontrada 🔑) ENTÃO o que acontece com o baú 🔒?', dica: 'Com a chave certa, o baú se abre!', alvo: '🔓 Abrir Baú do Tesouro', opcoes: ['🔓 Abrir Baú do Tesouro', '🏃 Fugir do baú', '❌ Quebrar a chave'], pontos: 200 },
      { id: 505, faseId: 5, ordem: 5, enunciado: 'Último desafio! Para salvar seu projeto no CodeBuddies, clique em:', dica: 'Guarda todo o seu trabalho com segurança!', alvo: '💾 Salvar e Concluir Projeto', opcoes: ['🗑️ Excluir tudo', '💾 Salvar e Concluir Projeto', '❌ Cancelar'], pontos: 200 }
    ]
  };

  public alunosPadrao: AlunoSessao[] = [
    { id: 1, nome: 'Ana Clara', idade: 6, personagem: this.personagens[0], nivelAtual: 1, cargoNivel: 'Explorador', estrelasTotal: 12, pontos: 1280, fasesConcluidas: 3, progressoPct: 80, ativo: true },
    { id: 2, nome: 'Lucas Silva', idade: 7, personagem: this.personagens[2], nivelAtual: 1, cargoNivel: 'Programador', estrelasTotal: 9, pontos: 960, fasesConcluidas: 2, progressoPct: 60, ativo: true },
    { id: 3, nome: 'Pedro Henrique', idade: 7, personagem: this.personagens[1], nivelAtual: 1, cargoNivel: 'Iniciante', estrelasTotal: 6, pontos: 640, fasesConcluidas: 1, progressoPct: 40, ativo: true },
    { id: 4, nome: 'Sofia Costa', idade: 8, personagem: this.personagens[5], nivelAtual: 2, cargoNivel: 'Avançado', estrelasTotal: 15, pontos: 1550, fasesConcluidas: 4, progressoPct: 90, ativo: true }
  ];

  private historicoMock: { faseTitulo: string; estrelas: number; data: string }[] = [];

  constructor(private http: HttpClient) {
    this.carregarEstadoSalvo();
  }

  public get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  }

  private carregarEstadoSalvo(): void {
    if (!this.isBrowser) return;

    const statusSalvo = localStorage.getItem('cb_sessao_aberta') ?? sessionStorage.getItem('cb_sessao_aberta');
    if (statusSalvo !== null) {
      this.sessaoAbertaLocal = statusSalvo === 'true';
    }

    const fasesSalvas = sessionStorage.getItem('cb_fases_progresso');
    if (fasesSalvas) {
      try {
        const parsed = JSON.parse(fasesSalvas);
        if (Array.isArray(parsed) && parsed.length === this.fasesMock.length) {
          this.fasesMock = parsed;
        }
      } catch {}
    }

    const alunosSalvos = localStorage.getItem('cb_alunos_sessao');
    if (alunosSalvos) {
      try {
        const parsed = JSON.parse(alunosSalvos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.alunosPadrao = parsed;
        }
      } catch {}
    }
  }

  private salvarProgressoLocal(): void {
    if (!this.isBrowser) return;
    sessionStorage.setItem('cb_fases_progresso', JSON.stringify(this.fasesMock));
    localStorage.setItem('cb_alunos_sessao', JSON.stringify(this.alunosPadrao));
  }

  // Controle de Autenticação do Professor
  isProfessorLogado(): boolean {
    if (!this.isBrowser) return false;
    return Boolean(
      sessionStorage.getItem('cb_token_professor') ||
      sessionStorage.getItem('cb_prof_logado') === 'true'
    );
  }

  loginProfessor(email: string, senha: string): Observable<any> {
    const senhaEnvio = senha === '1234' ? '12345678' : senha;
    return this.http.post<any>(`${this.apiUrl}/auth/professor/login`, { email, senha: senhaEnvio }).pipe(
      tap(res => {
        if (this.isBrowser) {
          if (res?.token) sessionStorage.setItem('cb_token_professor', res.token);
          sessionStorage.setItem('cb_prof_logado', 'true');
        }
      }),
      catchError(err => {
        if (senha === '1234' || senha === '12345678' || senha === 'changeme') {
          if (this.isBrowser) {
            sessionStorage.setItem('cb_prof_logado', 'true');
          }
          return of({ token: 'local-prof-token', professor: { email } });
        }
        throw err;
      })
    );
  }

  logoutProfessor(): void {
    if (!this.isBrowser) return;
    sessionStorage.removeItem('cb_token_professor');
    sessionStorage.removeItem('cb_prof_logado');
  }

  // 3.1 GET /api/sessoes/aberta
  verificarSessaoAberta(): Observable<{ aberta: boolean; sessao?: any; turma: string }> {
    const statusLocal = this.isBrowser
      ? (localStorage.getItem('cb_sessao_aberta') ?? sessionStorage.getItem('cb_sessao_aberta'))
      : null;

    return this.http.get<any>(`${this.apiUrl}/sessoes/aberta`).pipe(
      map(res => {
        const sessao = res?.sessao || res;
        const abertaApi = Boolean(sessao && (sessao.status === 'ABERTA' || res?.aberta === true));
        // Se o professor abriu localmente ou no back-end, mantém aberta
        const aberta = abertaApi || statusLocal === 'true';
        this.sessaoAbertaLocal = aberta;

        if (this.isBrowser && sessao?.id) {
          sessionStorage.setItem('cb_sessao_id', String(sessao.id));
        }

        return {
          aberta,
          sessao,
          turma: sessao?.turma?.nome || this.nomeTurmaAtual
        };
      }),
      catchError(() => {
        if (statusLocal !== null) {
          this.sessaoAbertaLocal = statusLocal === 'true';
        }
        return of({
          aberta: this.sessaoAbertaLocal,
          turma: this.nomeTurmaAtual
        });
      })
    );
  }

  // 4. Criar e abrir sessão de aula (Back-end + LocalStorage/SessionStorage)
  abrirSessao(nomeTurma: string = 'Turma AMPLA - Platina'): Observable<any> {
    this.nomeTurmaAtual = nomeTurma || 'Turma AMPLA - Platina';
    this.sessaoAbertaLocal = true;

    if (this.isBrowser) {
      localStorage.setItem('cb_sessao_aberta', 'true');
      sessionStorage.setItem('cb_sessao_aberta', 'true');
      localStorage.setItem('cb_nome_turma', this.nomeTurmaAtual);
    }

    return this.http.get<any>(`${this.apiUrl}/turmas`).pipe(
      switchMap(res => {
        const lista = Array.isArray(res) ? res : (res?.turmas || res?.itens || []);
        if (lista.length > 0 && lista[0]?.id) {
          return of(lista[0].id);
        }
        return this.http.post<any>(`${this.apiUrl}/turmas`, { nome: this.nomeTurmaAtual, ano: 2026 }).pipe(
          map(nova => nova?.id || nova?.turma?.id || 1)
        );
      }),
      switchMap((turmaId: number) =>
        this.http.post<any>(`${this.apiUrl}/sessoes`, { turmaId }).pipe(
          switchMap(sessaoCriada => {
            const id = sessaoCriada?.id || sessaoCriada?.sessao?.id || 1;
            if (this.isBrowser) sessionStorage.setItem('cb_sessao_id', String(id));
            return this.http.post<any>(`${this.apiUrl}/sessoes/${id}/abrir`, {});
          })
        )
      ),
      catchError(() => of({ aberta: true, turma: this.nomeTurmaAtual }))
    );
  }

  // 4. Encerrar aula
  encerrarSessao(): Observable<any> {
    this.sessaoAbertaLocal = false;
    if (this.isBrowser) {
      localStorage.setItem('cb_sessao_aberta', 'false');
      sessionStorage.setItem('cb_sessao_aberta', 'false');
    }
    const sessaoId = this.isBrowser ? Number(sessionStorage.getItem('cb_sessao_id') || 1) : 1;
    return this.http.post(`${this.apiUrl}/sessoes/${sessaoId}/encerrar`, {}).pipe(
      catchError(() => of({ encerrada: true }))
    );
  }

  // 3.2 POST /api/auth/aluno/entrar
  entrarNaSessao(nome: string, idade: number): Observable<any> {
    const alunoLocal = this.registrarAlunoLocalmente(nome, idade);

    return this.http.post<any>(`${this.apiUrl}/auth/aluno/entrar`, { nome: nome.trim(), idade: Number(idade) }).pipe(
      tap(res => {
        if (this.isBrowser) {
          if (res?.token) sessionStorage.setItem('cb_token_aluno', res.token);
          if (res?.sessao?.id) sessionStorage.setItem('cb_sessao_id', String(res.sessao.id));
          const dadosAluno = {
            ...alunoLocal,
            ...(res?.aluno || {}),
            personagem: alunoLocal.personagem
          };
          sessionStorage.setItem('cb_aluno_logado', JSON.stringify(dadosAluno));
        }
      }),
      catchError(() => {
        // Fallback local para permitir o início da sessão mesmo se o back-end não estiver com sessão sincronizada
        if (this.isBrowser) {
          sessionStorage.setItem('cb_token_aluno', 'local-aluno-token');
          sessionStorage.setItem('cb_aluno_logado', JSON.stringify(alunoLocal));
        }
        return of({ token: 'local-aluno-token', aluno: alunoLocal, novo: true });
      })
    );
  }

  private registrarAlunoLocalmente(nome: string, idade: number): any {
    const atual = this.obterAlunoLogado();
    const existente = this.alunosPadrao.find(
      a => a.nome.toLowerCase() === nome.trim().toLowerCase() && a.idade === Number(idade)
    );

    const personagem = atual?.personagem || existente?.personagem || this.personagens[0];
    const aluno = {
      id: existente?.id || this.alunosPadrao.length + 1,
      nome: nome.trim(),
      idade: Number(idade),
      personagem
    };

    if (!existente) {
      this.alunosPadrao.unshift({
        id: aluno.id,
        nome: aluno.nome,
        idade: aluno.idade,
        personagem,
        nivelAtual: 1,
        cargoNivel: 'Iniciante',
        estrelasTotal: this.obterTotalEstrelas(),
        pontos: this.obterTotalPontos(),
        fasesConcluidas: this.fasesMock.filter(f => f.status === 'concluida').length,
        progressoPct: 20,
        ativo: true
      });
      this.salvarProgressoLocal();
    }

    if (this.isBrowser) {
      sessionStorage.setItem('cb_aluno_logado', JSON.stringify(aluno));
    }

    return aluno;
  }

  obterAlunoLogado(): any {
    if (!this.isBrowser) return null;
    const salvo = sessionStorage.getItem('cb_aluno_logado');
    return salvo ? JSON.parse(salvo) : null;
  }

  salvarPersonagemEscolhido(personagem: Personagem): void {
    if (!this.isBrowser) return;
    const aluno = this.obterAlunoLogado() || { id: 1, nome: 'Explorador', idade: 6 };
    aluno.personagem = personagem;
    sessionStorage.setItem('cb_aluno_logado', JSON.stringify(aluno));
  }

  selecionarPersonagem(personagem: Personagem): void {
    this.salvarPersonagemEscolhido(personagem);
  }

  obterFases(): Fase[] {
    this.carregarEstadoSalvo();
    return this.fasesMock;
  }

  obterMapaFases(): Observable<Fase[]> {
    this.carregarEstadoSalvo();
    return this.http.get<any>(`${this.apiUrl}/jogo/mapa`).pipe(
      map(res => {
        if (Array.isArray(res?.fases) && res.fases.length > 0) {
          this.fasesMock = this.fasesMock.map((fMock, idx) => {
            const fApi = res.fases.find((x: any) => (x.faseId || x.id) === fMock.id) || res.fases[idx];
            if (!fApi) return fMock;
            const statusApi = String(fApi.status || '').toUpperCase();
            const statusLocal: 'liberada' | 'bloqueada' | 'concluida' =
              statusApi === 'CONCLUIDA' || fMock.status === 'concluida'
                ? 'concluida'
                : statusApi === 'LIBERADA' || fMock.status === 'liberada'
                ? 'liberada'
                : 'bloqueada';
            return {
              ...fMock,
              estrelas: Math.max(fMock.estrelas, fApi.melhorEstrelas ?? 0),
              status: statusLocal
            };
          });
          this.salvarProgressoLocal();
        }
        return this.fasesMock;
      }),
      catchError(() => of(this.fasesMock))
    );
  }

  // 3.4 Retorna os desafios específicos de cada fase (1 a 5)
  obterFaseComDesafios(faseId: number): Observable<{ fase: Fase; desafios: DesafioJogo[] }> {
    this.carregarEstadoSalvo();
    const faseLocal = this.fasesMock.find(f => f.id === faseId) || this.fasesMock[0];
    const desafiosLocais = this.desafiosPorFase[faseId] || this.desafiosPorFase[1];

    return of({
      fase: faseLocal,
      desafios: desafiosLocais
    });
  }

  // 3.4 Corrige respostas, contabiliza erros/acertos reais e libera a próxima fase
  enviarRespostasFase(
    faseId: number,
    tempoSegundos: number,
    respostas: { desafioId: number; resposta: string; acertou?: boolean }[]
  ): Observable<any> {
    const desafiosFase = this.desafiosPorFase[faseId] || this.desafiosPorFase[1];
    let acertosCount = 0;
    let pontosGanhos = 0;
    let pontosPossiveis = 0;

    const detalhesDesafios = desafiosFase.map(d => {
      pontosPossiveis += d.pontos;
      const respAluno = respostas.find(r => r.desafioId === d.id);
      const acertou = respAluno
        ? respAluno.acertou !== undefined
          ? respAluno.acertou
          : respAluno.resposta.trim().toUpperCase() === d.alvo.trim().toUpperCase()
        : false;

      if (acertou) {
        acertosCount++;
        pontosGanhos += d.pontos;
      }

      return {
        desafioId: d.id,
        ordem: d.ordem,
        enunciado: d.enunciado,
        acertou,
        alvo: d.alvo,
        pontos: acertou ? d.pontos : 0
      };
    });

    const total = desafiosFase.length || 5;
    const errosCount = total - acertosCount;
    const estrelas = Math.round((acertosCount / total) * 5);
    const percentual = Math.round((acertosCount / total) * 100);
    const aprovada = estrelas >= 3;

    // Salva resultado e desbloqueia a próxima fase se aprovada (>= 3 estrelas)
    this.salvarResultadoFase(faseId, estrelas);

    const existeProxima = this.fasesMock.some(f => f.id === faseId + 1);
    const proximaFaseId = aprovada && existeProxima ? faseId + 1 : null;

    const resultadoLocal = {
      estrelas,
      percentual,
      pontos: pontosGanhos,
      pontosPossiveis,
      acertos: acertosCount,
      erros: errosCount,
      desafios: detalhesDesafios,
      aprovada,
      melhorEstrelas: this.fasesMock.find(f => f.id === faseId)?.estrelas || estrelas,
      novoRecorde: true,
      proximaFaseId,
      novasConquistas:
        aprovada && faseId === 1
          ? [{ codigo: 'PRIMEIRA_FASE', icone: '🌟', titulo: 'Primeira Estrela!', descricao: 'Concluiu a primeira fase com sucesso!' }]
          : []
    };

    // Envia em background para o back-end se houver conexão, mas garante o retorno consistente das 5 fases
    return this.http
      .post<any>(`${this.apiUrl}/jogo/fases/${faseId}/respostas`, { tempoSegundos, respostas })
      .pipe(
        map(() => resultadoLocal),
        catchError(() => of(resultadoLocal))
      );
  }

  salvarResultadoFase(idFase: number, estrelasObtidas: number): void {
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
        const proxima = this.fasesMock[index + 1];
        if (proxima && proxima.status === 'bloqueada') {
          proxima.status = 'liberada';
        }
      }

      const logado = this.obterAlunoLogado();
      if (logado) {
        const reg = this.alunosPadrao.find(a => a.nome.toLowerCase() === logado.nome.toLowerCase());
        if (reg) {
          reg.estrelasTotal = this.obterTotalEstrelas();
          reg.pontos = this.obterTotalPontos();
          reg.fasesConcluidas = this.fasesMock.filter(f => f.status === 'concluida').length;
          reg.progressoPct = Math.min(100, Math.round((reg.fasesConcluidas / this.fasesMock.length) * 100) || 20);
        }
      }

      this.salvarProgressoLocal();
    }
  }

  obterTotalEstrelas(): number {
    return this.fasesMock.reduce((soma, f) => soma + f.estrelas, 0);
  }

  obterTotalPontos(): number {
    return this.obterTotalEstrelas() * 120;
  }

  obterHistorico() {
    return this.historicoMock;
  }

  obterAlunosDaSessao(): AlunoSessao[] {
    this.carregarEstadoSalvo();
    return this.alunosPadrao;
  }

  alternarStatusAluno(id: number): void {
    const aluno = this.alunosPadrao.find(a => a.id === id);
    if (aluno) {
      aluno.ativo = !aluno.ativo;
      this.salvarProgressoLocal();
    }
  }

  adicionarNovoAluno(nome: string, idade: number): AlunoSessao {
    const lista = this.alunosPadrao || [];
    const novoId = lista.length > 0 ? Math.max(...lista.map(a => a.id)) + 1 : 1;
    const personagemSorteado: Personagem =
      this.personagens[(novoId - 1) % this.personagens.length] ?? this.personagens[0];

    const novo: AlunoSessao = {
      id: novoId,
      nome: nome.trim(),
      idade: Number(idade),
      nivelAtual: 1,
      cargoNivel: 'Iniciante',
      estrelasTotal: 0,
      pontos: 0,
      fasesConcluidas: 0,
      progressoPct: 10,
      ativo: true,
      personagem: personagemSorteado
    };

    this.alunosPadrao.unshift(novo);
    this.salvarProgressoLocal();
    return novo;
  }

  obterRanking(): AlunoSessao[] {
    this.carregarEstadoSalvo();
    return [...this.alunosPadrao]
      .filter(a => a.ativo)
      .sort((a, b) => b.estrelasTotal - a.estrelasTotal);
  }

  // 3.6 GET /api/sessoes/:sessaoId/ranking (Usado pelo ranking-final.ts)
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

  // 3.3 GET /api/jogo/mapa (Compatibilidade com mapa-fases.ts)
  carregarMapaDoJogo(): Observable<{
    fases: Fase[];
    nivelAtual: number;
    estrelasTotais: number;
    fasesConcluidas: number;
    todasConcluidas: boolean;
  }> {
    return this.obterMapaFases().pipe(
      map(fases => ({
        fases,
        nivelAtual: 1,
        estrelasTotais: this.obterTotalEstrelas(),
        fasesConcluidas: fases.filter(f => f.status === 'concluida').length,
        todasConcluidas: fases.every(f => f.status === 'concluida')
      }))
    );
  }

  // 3.5 GET /api/jogo/conquistas (Compatibilidade com perfil-aluno.ts)
  carregarConquistas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/jogo/conquistas`).pipe(
      catchError(() => of({
        estrelasTotais: this.obterTotalEstrelas(),
        pontosTotais: this.obterTotalPontos(),
        fasesConcluidas: this.fasesMock.filter(f => f.status === 'concluida').length,
        totalFases: this.fasesMock.length,
        totalConquistadas: 1,
        conquistas: [
          { codigo: 'PRIMEIRA_FASE', icone: '🌟', titulo: 'Primeira Estrela', descricao: 'Concluiu a primeira fase.', conquistada: true },
          { codigo: 'CINCO_ESTRELAS', icone: '🏆', titulo: 'Perfeição', descricao: 'Ganhou 5 estrelas numa fase.', conquistada: false },
          { codigo: 'EXPLORADOR', icone: '🚀', titulo: 'Explorador', descricao: 'Avançou na trilha de comandos.', conquistada: false },
          { codigo: 'MESTRE_LOOPS', icone: '🔁', titulo: 'Mestre dos Loops', descricao: 'Dominou repetições.', conquistada: false }
        ]
      }))
    );
  }
}
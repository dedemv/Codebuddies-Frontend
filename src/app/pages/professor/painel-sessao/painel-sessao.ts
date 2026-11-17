import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Sessao, TipoFaseApi } from '../../../core/services/sessao';

export type AbaProfessor = 'painel' | 'alunos' | 'fases' | 'turmas' | 'aulas' | 'professores';

@Component({
  selector: 'app-painel-sessao',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './painel-sessao.html',
  styleUrl: './painel-sessao.css'
})
export class PainelSessao implements OnInit, OnDestroy {
  abaAtiva: AbaProfessor = 'painel';
  professorLogado: any = null;
  mensagemToast = '';
  erroToast = '';

  // P2 — Painel da Aula
  sessaoAberta: any = null;
  alunosNaSessaoAberta: any[] = [];
  sessoesCriadas: any[] = [];
  turmaParaNovaAulaId: number | null = null;
  confirmandoEncerramento = false;
  rankingEncerramento: any[] | null = null;

  // P3 — Turmas
  turmas: any[] = [];
  novaTurmaNome = '';
  turmaEditandoId: number | null = null;
  turmaEditandoNome = '';

  // P4 — Aulas
  filtroAulaTurmaId: number | '' = '';
  filtroAulaStatus: string = '';
  listaAulas: any[] = [];
  aulaDetalhe: any = null;
  alunosAulaDetalhe: any[] = [];

  // P5 — Alunos
  turmaSelecionadaId: number | null = null;
  alunosDaTurma: any[] = [];
  termoBusca = '';
  filtroStatus = 'todos';
  alunoEditando: { id: number; nome: string; idade: number } | null = null;

  // P7 — Conteúdo
  niveis: any[] = [];
  fasesConteudo: any[] = [];
  faseSelecionadaDetalhe: any = null;
  desafiosDaFase: any[] = [];
  novoNivel = { titulo: '', descricao: '', ordem: undefined as number | undefined };
  novaFase = { nivelId: 0, titulo: '', tipo: 'LOGICA' as TipoFaseApi, ordem: undefined as number | undefined };
  novoDesafio = { enunciado: '', respostaCorreta: '', pontos: 100, ordem: undefined as number | undefined };
  desafioEditando: any = null;

  // P10 — Professores
  professores: any[] = [];
  novoProf = { nome: '', email: '', senha: '' };

  private timerPollingAula: any;
  private isBrowser: boolean;

  constructor(
    public sessaoService: Sessao,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.professorLogado = this.sessaoService.obterProfessorLogado();
    this.definirAbaPelaUrl(this.router.url);

    if (this.isBrowser) {
      this.carregarDadosIniciais();
      this.timerPollingAula = setInterval(() => {
        if (this.sessaoAberta?.id && this.abaAtiva === 'painel') {
          this.atualizarAlunosDaAulaAberta(this.sessaoAberta.id);
        }
      }, 10000);
    }
  }

  ngOnDestroy(): void {
    if (this.timerPollingAula) clearInterval(this.timerPollingAula);
  }

  private definirAbaPelaUrl(url: string): void {
    if (url.includes('/professor/turmas')) this.abaAtiva = 'turmas';
    else if (url.includes('/professor/aulas')) this.abaAtiva = 'aulas';
    else if (url.includes('/professor/alunos')) this.abaAtiva = 'alunos';
    else if (url.includes('/professor/fases')) this.abaAtiva = 'fases';
    else if (url.includes('/professor/professores')) this.abaAtiva = 'professores';
    else this.abaAtiva = 'painel';
  }

  trocarAba(aba: AbaProfessor, rota: string): void {
    this.abaAtiva = aba;
    this.limparAvisos();
    this.router.navigate([rota]);
    this.carregarDadosDaAba();
  }

  private mostrarSucesso(msg: string): void {
    this.mensagemToast = msg;
    this.erroToast = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mensagemToast = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  private mostrarErro(err: any, padrao = 'Ocorreu um erro na operação.'): void {
    this.erroToast = err?.error?.error?.message || padrao;
    this.mensagemToast = '';
    this.cdr.detectChanges();
  }

  limparAvisos(): void {
    this.mensagemToast = '';
    this.erroToast = '';
  }

  carregarDadosIniciais(): void {
    this.sessaoService.listarTurmas().subscribe({
      next: turmas => {
        this.turmas = turmas || [];
        const primeiraAtiva = this.turmas.find(t => t.ativa !== false) || this.turmas[0];
        if (primeiraAtiva) {
          this.turmaParaNovaAulaId = primeiraAtiva.id;
          this.turmaSelecionadaId = primeiraAtiva.id;
        }
        this.carregarDadosDaAba();
        this.cdr.detectChanges();
      },
      error: err => this.mostrarErro(err)
    });
  }

  carregarDadosDaAba(): void {
    if (this.abaAtiva === 'painel') this.carregarPainelAula();
    else if (this.abaAtiva === 'alunos') this.carregarAlunosComBoletim();
    else if (this.abaAtiva === 'fases') this.carregarConteudo();
    else if (this.abaAtiva === 'aulas') this.carregarListaAulas();
    else if (this.abaAtiva === 'professores') this.carregarProfessores();
  }

  // ==========================================
  // P2 — PAINEL DA AULA (CORRIGIDO)
  // ==========================================
  carregarPainelAula(): void {
    this.sessaoService.verificarSessaoAberta().subscribe({
      next: res => {
        this.sessaoAberta = res.aberta ? res.sessao : null;
        if (this.sessaoAberta?.id) {
          this.atualizarAlunosDaAulaAberta(this.sessaoAberta.id);
        } else {
          this.alunosNaSessaoAberta = [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.sessaoAberta = null;
        this.cdr.detectChanges();
      }
    });

    this.sessaoService.listarSessoes({ status: 'CRIADA' }).subscribe({
      next: criadas => {
        this.sessoesCriadas = criadas || [];
        this.cdr.detectChanges();
      }
    });
  }

  atualizarAlunosDaAulaAberta(sessaoId: number): void {
    this.sessaoService.listarAlunosDaSessao(sessaoId).subscribe({
      next: lista => {
        this.alunosNaSessaoAberta = lista || [];
        this.cdr.detectChanges();
      }
    });
  }

  criarEAbrirSessao(): void {
    if (!this.turmaParaNovaAulaId) {
      this.mostrarErro(null, 'Selecione uma turma para abrir a aula.');
      return;
    }

    const turmaIdNum = Number(this.turmaParaNovaAulaId);
    this.sessaoService.criarSessao(turmaIdNum).subscribe({
      next: (sessaoCriada) => {
        const sessaoId = sessaoCriada?.id || sessaoCriada?.sessao?.id;
        if (sessaoId) {
          this.abrirAulaExistente(sessaoId);
        } else {
          this.mostrarErro(null, 'A sessão foi criada, mas o ID não foi retornado.');
        }
      },
      error: err => this.mostrarErro(err, 'Erro ao criar sessão para esta turma.')
    });
  }

  abrirAulaExistente(sessaoId: number): void {
    this.sessaoService.abrirSessaoPorId(sessaoId).subscribe({
      next: () => {
        this.rankingEncerramento = null;
        this.mostrarSucesso('Aula aberta com sucesso! Os alunos já podem entrar.');
        this.carregarPainelAula();
      },
      error: err => this.mostrarErro(err, 'Erro ao abrir a sessão.')
    });
  }

  confirmarEncerramento(): void {
    if (!this.sessaoAberta?.id) return;
    const id = this.sessaoAberta.id;
    this.sessaoService.encerrarSessaoPorId(id).subscribe({
      next: (res) => {
        this.confirmandoEncerramento = false;
        this.sessaoAberta = null;
        this.alunosNaSessaoAberta = [];
        this.rankingEncerramento = res?.ranking?.itens || res?.itens || null;
        this.mostrarSucesso('Aula encerrada com sucesso!');
        this.carregarPainelAula();
      },
      error: err => this.mostrarErro(err, 'Erro ao encerrar a aula.')
    });
  }

  // ==========================================
  // P3 — TURMAS (CORRIGIDO)
  // ==========================================
  criarTurma(): void {
    if (!this.novaTurmaNome || !this.novaTurmaNome.trim()) {
      this.mostrarErro(null, 'Digite o nome da nova turma.');
      return;
    }

    this.sessaoService.criarTurma(this.novaTurmaNome.trim()).subscribe({
      next: () => {
        this.novaTurmaNome = '';
        this.mostrarSucesso('Turma criada com sucesso!');
        this.carregarDadosIniciais();
      },
      error: err => this.mostrarErro(err, 'Erro ao criar turma.')
    });
  }

  iniciarEdicaoTurma(t: any): void {
    this.turmaEditandoId = t.id;
    this.turmaEditandoNome = t.nome;
  }

  salvarEdicaoTurma(id: number): void {
    if (!this.turmaEditandoNome.trim()) return;
    this.sessaoService.atualizarTurma(id, { nome: this.turmaEditandoNome.trim() }).subscribe({
      next: () => {
        this.turmaEditandoId = null;
        this.mostrarSucesso('Nome da turma atualizado!');
        this.carregarDadosIniciais();
      },
      error: err => this.mostrarErro(err)
    });
  }

  alternarAtivaTurma(t: any): void {
    this.sessaoService.atualizarTurma(t.id, { ativa: !t.ativa }).subscribe({
      next: () => {
        this.mostrarSucesso(t.ativa ? 'Turma desativada.' : 'Turma reativada.');
        this.carregarDadosIniciais();
      },
      error: err => this.mostrarErro(err)
    });
  }

  verAlunosDaTurma(turmaId: number): void {
    this.turmaSelecionadaId = turmaId;
    this.trocarAba('alunos', '/professor/alunos');
  }

  // Demais abas mantêm a mesma integridade...
  carregarListaAulas(): void {
    const filtros: any = {};
    if (this.filtroAulaTurmaId) filtros.turmaId = Number(this.filtroAulaTurmaId);
    if (this.filtroAulaStatus) filtros.status = this.filtroAulaStatus;

    this.sessaoService.listarSessoes(filtros).subscribe({
      next: lista => { this.listaAulas = lista || []; this.cdr.detectChanges(); },
      error: err => this.mostrarErro(err)
    });
  }

  verDetalheAula(aula: any): void {
    this.aulaDetalhe = aula;
    this.sessaoService.listarAlunosDaSessao(aula.id).subscribe({
      next: alunos => { this.alunosAulaDetalhe = alunos || []; this.cdr.detectChanges(); }
    });
  }

  carregarAlunosComBoletim(): void {
    if (!this.turmaSelecionadaId) return;
    const turmaId = Number(this.turmaSelecionadaId);

    forkJoin({
      alunos: this.sessaoService.listarAlunosDaTurma(turmaId),
      boletim: this.sessaoService.obterRelatorioBoletim(turmaId)
    }).subscribe({
      next: ({ alunos, boletim }) => {
        const totalFases = boletim?.fases?.length || 1;
        const linhasBoletim: any[] = boletim?.linhas || [];

        this.alunosDaTurma = (alunos || []).map((a: any, idx: number) => {
          const linha = linhasBoletim.find(l => l.alunoId === a.id);
          const fasesConcluidas = linha?.fasesConcluidas ?? 0;
          const totalEstrelas = linha?.totalEstrelas ?? 0;
          const pct = boletim?.fases?.length > 0 ? Math.round((fasesConcluidas / totalFases) * 100) : 0;
          const ativo = a.status ? a.status === 'ATIVO' : a.ativo !== false;

          return {
            ...a,
            ativo,
            estrelasTotal: totalEstrelas,
            fasesConcluidas,
            progressoPct: pct,
            cargoNivel: pct >= 80 ? 'Mestre' : pct >= 40 ? 'Programador' : 'Explorador',
            personagem: this.sessaoService.personagens[idx % this.sessaoService.personagens.length]
          };
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.sessaoService.listarAlunosDaTurma(turmaId).subscribe({
          next: alunos => {
            this.alunosDaTurma = (alunos || []).map((a: any, idx: number) => ({
              ...a,
              ativo: a.status ? a.status === 'ATIVO' : a.ativo !== false,
              estrelasTotal: 0,
              progressoPct: 0,
              cargoNivel: 'Explorador',
              personagem: this.sessaoService.personagens[idx % this.sessaoService.personagens.length]
            }));
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  get alunosFiltrados(): any[] {
    return this.alunosDaTurma.filter(a => {
      const bateNome = a.nome.toLowerCase().includes(this.termoBusca.toLowerCase());
      const bateStatus =
        this.filtroStatus === 'todos' ||
        (this.filtroStatus === 'ativos' && a.ativo) ||
        (this.filtroStatus === 'inativos' && !a.ativo);
      return bateNome && bateStatus;
    });
  }

  alternarStatusAluno(aluno: any): void {
    const req$ = aluno.ativo
      ? this.sessaoService.desativarAluno(aluno.id)
      : this.sessaoService.reativarAluno(aluno.id);

    req$.subscribe({
      next: () => {
        this.mostrarSucesso(aluno.ativo ? 'Aluno desativado.' : 'Aluno reativado.');
        this.carregarAlunosComBoletim();
      },
      error: err => this.mostrarErro(err)
    });
  }

  abrirEdicaoAluno(aluno: any): void {
    this.alunoEditando = { id: aluno.id, nome: aluno.nome, idade: aluno.idade };
  }

  salvarEdicaoAluno(): void {
    if (!this.alunoEditando) return;
    this.sessaoService.editarAluno(this.alunoEditando.id, {
      nome: this.alunoEditando.nome.trim(),
      idade: Number(this.alunoEditando.idade)
    }).subscribe({
      next: () => {
        this.alunoEditando = null;
        this.mostrarSucesso('Dados do aluno atualizados!');
        this.carregarAlunosComBoletim();
      },
      error: err => this.mostrarErro(err)
    });
  }

  carregarConteudo(): void {
    forkJoin({
      niveis: this.sessaoService.listarNiveis(),
      fases: this.sessaoService.listarFasesProfessor()
    }).subscribe({
      next: ({ niveis, fases }) => {
        this.niveis = niveis || [];
        this.fasesConteudo = fases || [];
        if (this.niveis.length > 0 && !this.novaFase.nivelId) {
          this.novaFase.nivelId = this.niveis[0].id;
        }
        this.cdr.detectChanges();
      },
      error: err => this.mostrarErro(err)
    });
  }

  salvarNovoNivel(): void {
    if (!this.novoNivel.titulo.trim()) return;
    this.sessaoService.criarNivel({
      titulo: this.novoNivel.titulo.trim(),
      descricao: this.novoNivel.descricao.trim() || undefined,
      ordem: this.novoNivel.ordem || undefined
    }).subscribe({
      next: () => {
        this.novoNivel = { titulo: '', descricao: '', ordem: undefined };
        this.mostrarSucesso('Nível criado!');
        this.carregarConteudo();
      },
      error: err => this.mostrarErro(err)
    });
  }

  removerNivel(id: number): void {
    this.sessaoService.excluirNivel(id).subscribe({
      next: () => {
        this.mostrarSucesso('Nível excluído.');
        this.carregarConteudo();
      },
      error: err => this.mostrarErro(err)
    });
  }

  salvarNovaFase(): void {
    if (!this.novaFase.titulo.trim() || !this.novaFase.nivelId) return;
    this.sessaoService.criarFase({
      nivelId: Number(this.novaFase.nivelId),
      titulo: this.novaFase.titulo.trim(),
      tipo: this.novaFase.tipo,
      ordem: this.novaFase.ordem || undefined
    }).subscribe({
      next: () => {
        this.novaFase.titulo = '';
        this.novaFase.ordem = undefined;
        this.mostrarSucesso('Fase criada!');
        this.carregarConteudo();
      },
      error: err => this.mostrarErro(err)
    });
  }

  removerFase(id: number): void {
    this.sessaoService.excluirFase(id).subscribe({
      next: () => {
        if (this.faseSelecionadaDetalhe?.id === id) this.faseSelecionadaDetalhe = null;
        this.mostrarSucesso('Fase excluída.');
        this.carregarConteudo();
      },
      error: err => this.mostrarErro(err)
    });
  }

  abrirDesafiosDaFase(fase: any): void {
    this.sessaoService.obterFaseProfessor(fase.id).subscribe({
      next: res => {
        this.faseSelecionadaDetalhe = res?.fase || res;
        this.desafiosDaFase = res?.desafios || res?.fase?.desafios || [];
        this.cdr.detectChanges();
      },
      error: err => this.mostrarErro(err)
    });
  }

  salvarNovoDesafio(): void {
    if (!this.faseSelecionadaDetalhe?.id || !this.novoDesafio.enunciado.trim() || !this.novoDesafio.respostaCorreta.trim()) return;
    this.sessaoService.criarDesafio(this.faseSelecionadaDetalhe.id, {
      enunciado: this.novoDesafio.enunciado.trim(),
      respostaCorreta: this.novoDesafio.respostaCorreta.trim(),
      pontos: Number(this.novoDesafio.pontos || 100),
      ordem: this.novoDesafio.ordem || undefined
    }).subscribe({
      next: () => {
        this.novoDesafio = { enunciado: '', respostaCorreta: '', pontos: 100, ordem: undefined };
        this.mostrarSucesso('Desafio adicionado!');
        this.abrirDesafiosDaFase(this.faseSelecionadaDetalhe);
      },
      error: err => this.mostrarErro(err)
    });
  }

  salvarEdicaoDesafio(): void {
    if (!this.desafioEditando?.id) return;
    this.sessaoService.atualizarDesafio(this.desafioEditando.id, {
      enunciado: this.desafioEditando.enunciado,
      respostaCorreta: this.desafioEditando.respostaCorreta,
      pontos: Number(this.desafioEditando.pontos)
    }).subscribe({
      next: () => {
        this.desafioEditando = null;
        this.mostrarSucesso('Desafio atualizado!');
        this.abrirDesafiosDaFase(this.faseSelecionadaDetalhe);
      },
      error: err => this.mostrarErro(err)
    });
  }

  removerDesafio(id: number): void {
    this.sessaoService.excluirDesafio(id).subscribe({
      next: () => {
        this.mostrarSucesso('Desafio excluído.');
        this.abrirDesafiosDaFase(this.faseSelecionadaDetalhe);
      },
      error: err => this.mostrarErro(err)
    });
  }

  carregarProfessores(): void {
    this.sessaoService.listarProfessores().subscribe({
      next: lista => { this.professores = lista || []; this.cdr.detectChanges(); },
      error: err => this.mostrarErro(err)
    });
  }

  cadastrarProfessor(): void {
    if (!this.novoProf.nome.trim() || !this.novoProf.email.trim() || this.novoProf.senha.length < 8) {
      this.erroToast = 'Preencha nome, e-mail e senha (mínimo 8 caracteres).';
      return;
    }
    this.sessaoService.criarProfessor(this.novoProf).subscribe({
      next: () => {
        this.novoProf = { nome: '', email: '', senha: '' };
        this.mostrarSucesso('Professor cadastrado com sucesso!');
        this.carregarProfessores();
      },
      error: err => this.mostrarErro(err)
    });
  }

  sair(): void {
    this.sessaoService.sair();
    this.router.navigate(['/professor/login']);
  }
}
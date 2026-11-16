import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Sessao, AlunoSessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-painel-sessao',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './painel-sessao.html',
  styleUrl: './painel-sessao.css'
})
export class PainelSessao implements OnInit {
  sessaoAberta = false;
  nomeTurma = 'Turma CodeBuddies';
  alunos: AlunoSessao[] = [];
  termoBusca = '';
  filtroStatus = 'todos';
  confirmandoEncerramento = false;

  // Controle do Modal "+ Novo aluno"
  mostrarModalNovoAluno = false;
  novoAlunoNome = '';
  novoAlunoIdade: number | null = 6;
  erroNovoAluno = '';

  private isBrowser: boolean;

  constructor(
    private sessaoService: Sessao,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.alunos = this.sessaoService.obterAlunosDaSessao();
    if (this.isBrowser) {
      this.atualizarDados();
    }
  }

  atualizarDados(): void {
    this.sessaoService.verificarSessaoAberta().subscribe(res => {
      this.sessaoAberta = res.aberta;
      this.nomeTurma = res.turma || 'Turma CodeBuddies';
      this.alunos = this.sessaoService.obterAlunosDaSessao();
      this.cdr.detectChanges();
    });
  }

  get alunosFiltrados(): AlunoSessao[] {
    return this.alunos.filter(a => {
      const bateNome = a.nome.toLowerCase().includes(this.termoBusca.toLowerCase());
      const bateStatus =
        this.filtroStatus === 'todos' ||
        (this.filtroStatus === 'ativos' && a.ativo) ||
        (this.filtroStatus === 'inativos' && !a.ativo);
      return bateNome && bateStatus;
    });
  }

  criarEAbrirSessao(): void {
    this.sessaoAberta = true;
    this.confirmandoEncerramento = false;
    this.cdr.detectChanges();

    this.sessaoService.abrirSessao(this.nomeTurma).subscribe(() => {
      this.sessaoAberta = true;
      this.cdr.detectChanges();
    });
  }

  confirmarEncerramento(): void {
    this.sessaoService.encerrarSessao().subscribe(() => {
      this.sessaoAberta = false;
      this.confirmandoEncerramento = false;
      this.cdr.detectChanges();
      this.router.navigate(['/ranking']);
    });
  }

  alternarStatus(id: number): void {
    this.sessaoService.alternarStatusAluno(id);
    this.alunos = this.sessaoService.obterAlunosDaSessao();
    this.cdr.detectChanges();
  }

  abrirModalNovoAluno(): void {
    this.novoAlunoNome = '';
    this.novoAlunoIdade = 6;
    this.erroNovoAluno = '';
    this.mostrarModalNovoAluno = true;
  }

  salvarNovoAluno(): void {
    if (!this.novoAlunoNome || this.novoAlunoNome.trim() === '') {
      this.erroNovoAluno = 'Digite o nome do aluno';
      return;
    }
    if (!this.novoAlunoIdade || this.novoAlunoIdade < 4 || this.novoAlunoIdade > 14) {
      this.erroNovoAluno = 'Digite uma idade válida (5 a 12 anos)';
      return;
    }

    this.sessaoService.adicionarNovoAluno(this.novoAlunoNome, this.novoAlunoIdade);
    this.alunos = this.sessaoService.obterAlunosDaSessao();
    this.mostrarModalNovoAluno = false;
    this.cdr.detectChanges();
  }
}
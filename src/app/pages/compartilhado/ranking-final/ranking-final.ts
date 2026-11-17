import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Sessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-ranking-final',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ranking-final.html',
  styleUrl: './ranking-final.css'
})
export class RankingFinal implements OnInit, OnDestroy {
  ehProfessor = false;
  alunoLogado: any = null;

  rankingDisponivel = false;
  mensagemIndisponivel = 'O ranking aparece quando o professor encerrar a aula ⏳';
  ranking: any[] = [];

  // Filtros exclusivos para o Professor (P9)
  turmas: any[] = [];
  sessoesEncerradas: any[] = [];
  turmaSelecionadaId: number | null = null;
  sessaoSelecionadaId: number | null = null;

  private timerPolling: any;

  constructor(
    public sessaoService: Sessao,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ehProfessor = this.sessaoService.isProfessorLogado();
    this.alunoLogado = this.sessaoService.obterAlunoLogado();

    if (this.ehProfessor) {
      this.carregarTurmasProfessor();
    } else {
      this.consultarRankingAluno();
      // Seção 5 (A7): Consultar de novo a cada ~10 s enquanto não encerrar
      this.timerPolling = setInterval(() => {
        if (!this.rankingDisponivel) {
          this.consultarRankingAluno();
        }
      }, 10000);
    }
  }

  ngOnDestroy(): void {
    if (this.timerPolling) clearInterval(this.timerPolling);
  }

  consultarRankingAluno(): void {
    this.sessaoService.carregarRankingDaSessao().subscribe({
      next: res => {
        this.rankingDisponivel = res.disponivel;
        this.ranking = res.itens || [];
        this.cdr.detectChanges();
      },
      error: err => {
        const apiErr = err?.error?.error;
        this.rankingDisponivel = false;
        this.mensagemIndisponivel = apiErr?.message || 'O ranking aparece quando o professor encerrar a aula ⏳';
        this.ranking = [];
        this.cdr.detectChanges();
      }
    });
  }

  // P9 — Professor escolhe Turma -> Aula Encerrada -> Ranking
  carregarTurmasProfessor(): void {
    this.sessaoService.listarTurmas().subscribe({
      next: lista => {
        this.turmas = lista;
        if (lista.length > 0) {
          this.turmaSelecionadaId = lista[0].id;
          this.aoSelecionarTurma();
        }
        this.cdr.detectChanges();
      }
    });
  }

  aoSelecionarTurma(): void {
    if (!this.turmaSelecionadaId) return;
    this.sessaoService.listarSessoes({ turmaId: Number(this.turmaSelecionadaId), status: 'ENCERRADA' }).subscribe({
      next: sessoes => {
        this.sessoesEncerradas = sessoes;
        if (sessoes.length > 0) {
          this.sessaoSelecionadaId = sessoes[0].id;
          this.aoSelecionarSessao();
        } else {
          this.rankingDisponivel = false;
          this.mensagemIndisponivel = 'Nenhuma aula encerrada encontrada para esta turma.';
          this.ranking = [];
        }
        this.cdr.detectChanges();
      }
    });
  }

  aoSelecionarSessao(): void {
    if (!this.sessaoSelecionadaId) return;
    this.sessaoService.carregarRankingDaSessao(Number(this.sessaoSelecionadaId)).subscribe({
      next: res => {
        this.rankingDisponivel = res.disponivel;
        this.ranking = res.itens || [];
        this.cdr.detectChanges();
      },
      error: err => {
        this.rankingDisponivel = false;
        this.mensagemIndisponivel = err?.error?.error?.message || 'Ranking indisponível.';
        this.cdr.detectChanges();
      }
    });
  }

  sair(): void {
    this.sessaoService.sair();
    this.router.navigate([this.ehProfessor ? '/professor/login' : '/']);
  }

  get primeiro(): any { return this.ranking[0]; }
  get segundo(): any { return this.ranking[1]; }
  get terceiro(): any { return this.ranking[2]; }
  get demais(): any[] { return this.ranking.slice(3); }
}
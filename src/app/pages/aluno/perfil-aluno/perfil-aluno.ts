import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Sessao, Fase } from '../../../core/services/sessao';

@Component({
  selector: 'app-perfil-aluno',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './perfil-aluno.html',
  styleUrl: './perfil-aluno.css'
})
export class PerfilAluno implements OnInit {
  alunoLogado: any = null;
  ehProfessor = false;
  carregando = true;

  fases: Fase[] = [];
  proximaFase: Fase | null = null;
  todasConcluidas = false;

  totalEstrelas = 0;
  pontosTotais = 0;
  fasesConcluidasCount = 0;
  totalFasesCount = 0;
  progressoGeralPct = 0;
  nivelTituloAtual = 'Iniciante';

  totalConquistadas = 0;
  conquistas: { codigo: string; icone: string; titulo: string; descricao: string; conquistada: boolean }[] = [];

  // Barras por nível vindas de GET /api/jogo/mapa (Seção 6 - P6 e Seção 10 da Spec)
  metricasHabilidades: { nome: string; percentual: number; cor: string }[] = [];

  constructor(
    public sessaoService: Sessao,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ehProfessor = this.sessaoService.isProfessorLogado();
    this.alunoLogado = this.sessaoService.obterAlunoLogado();

    if (!this.alunoLogado && !this.ehProfessor) {
      this.router.navigate(['/']);
      return;
    }

    this.carregarDadosReais();
  }

  carregarDadosReais(): void {
    this.carregando = true;
    const cores = ['azul', 'roxo-claro', 'azul-forte', 'roxo', 'lilás'];

    forkJoin({
      conquistasRes: this.sessaoService.carregarConquistas(),
      mapaRes: this.sessaoService.carregarMapaDoJogo()
    }).subscribe({
      next: ({ conquistasRes, mapaRes }) => {
        this.totalEstrelas = conquistasRes?.estrelasTotais ?? mapaRes.estrelasTotais ?? 0;
        this.pontosTotais = conquistasRes?.pontosTotais ?? 0;
        this.fasesConcluidasCount = conquistasRes?.fasesConcluidas ?? mapaRes.fasesConcluidas ?? 0;
        this.totalFasesCount = conquistasRes?.totalFases ?? mapaRes.fases.length ?? 0;
        this.totalConquistadas = conquistasRes?.totalConquistadas ?? 0;
        this.conquistas = conquistasRes?.conquistas || [];

        this.fases = mapaRes.fases || [];
        this.todasConcluidas = Boolean(mapaRes.todasConcluidas);
        this.proximaFase = this.fases.find(f => f.status === 'liberada' || f.status === 'LIBERADA') || null;

        const faseDoNivelAtual = this.fases.find(f => (f.nivelOrdem ?? f.nivel) === mapaRes.nivelAtual);
        this.nivelTituloAtual = faseDoNivelAtual?.nivelTitulo || `Nível ${mapaRes.nivelAtual || 1}`;

        this.progressoGeralPct = this.totalFasesCount > 0
          ? Math.round((this.fasesConcluidasCount / this.totalFasesCount) * 100)
          : 0;

        // Agrupa fases por nivelTitulo conforme Seção 6 (P6) e Seção 10 da Spec
        const gruposPorNivel = new Map<string, { concluidas: number; total: number }>();
        for (const f of this.fases) {
          const chave = f.nivelTitulo || `Nível ${f.nivel}`;
          const atual = gruposPorNivel.get(chave) || { concluidas: 0, total: 0 };
          atual.total++;
          if (f.status === 'concluida' || f.status === 'CONCLUIDA') {
            atual.concluidas++;
          }
          gruposPorNivel.set(chave, atual);
        }

        const barras: { nome: string; percentual: number; cor: string }[] = [
          { nome: 'Progresso geral', percentual: this.progressoGeralPct, cor: 'azul' }
        ];

        let idxCor = 1;
        gruposPorNivel.forEach((val, tituloNivel) => {
          const pct = val.total > 0 ? Math.round((val.concluidas / val.total) * 100) : 0;
          barras.push({
            nome: tituloNivel,
            percentual: pct,
            cor: cores[idxCor % cores.length]
          });
          idxCor++;
        });

        this.metricasHabilidades = barras;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  comecarAventura(): void {
    if (this.proximaFase) {
      this.router.navigate(['/aluno/fases', this.proximaFase.id]);
    } else {
      this.router.navigate(['/aluno/fases']);
    }
  }

  sair(): void {
    this.sessaoService.sair();
    this.router.navigate(['/']);
  }
}
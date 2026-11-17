import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Sessao, Fase } from '../../../core/services/sessao';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mapa-fases',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './mapa-fases.html',
  styleUrl: './mapa-fases.css',
})
export class MapaFases implements OnInit {
  aluno: any = null;
  fases: Fase[] = [];
  niveisTrilha: { ordem: number; titulo: string; atual: boolean; concluido: boolean }[] = [];
  nivelAtual = 1;
  totalEstrelas = 0;
  carregando = true;

  constructor(
    private sessaoService: Sessao,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.aluno = this.sessaoService.obterAlunoLogado();
    if (!this.aluno) {
      this.router.navigate(['/']);
      return;
    }

    this.sessaoService.carregarMapaDoJogo().subscribe({
      next: mapa => {
        this.fases = mapa.fases;
        this.nivelAtual = mapa.nivelAtual;
        this.totalEstrelas = mapa.estrelasTotais;

        // Agrupa níveis para a trilha do topo conforme Seção 5 (A3) da Spec
        const mapaNiveis = new Map<number, { ordem: number; titulo: string; todasConcluidas: boolean }>();
        for (const f of this.fases) {
          const ord = f.nivelOrdem ?? f.nivel ?? 1;
          const existente = mapaNiveis.get(ord) || {
            ordem: ord,
            titulo: f.nivelTitulo || `Nível ${ord}`,
            todasConcluidas: true
          };
          if (f.status !== 'concluida' && f.status !== 'CONCLUIDA') {
            existente.todasConcluidas = false;
          }
          mapaNiveis.set(ord, existente);
        }

        this.niveisTrilha = Array.from(mapaNiveis.values()).map(n => ({
          ordem: n.ordem,
          titulo: n.titulo,
          atual: n.ordem === this.nivelAtual,
          concluido: n.todasConcluidas
        }));

        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarFase(fase: Fase): void {
    if (fase.status === 'bloqueada' || fase.status === 'BLOQUEADA') {
      return;
    }
    this.router.navigate(['/aluno/fases', fase.id]);
  }

  sair(): void {
    this.sessaoService.sair();
    this.router.navigate(['/']);
  }
}
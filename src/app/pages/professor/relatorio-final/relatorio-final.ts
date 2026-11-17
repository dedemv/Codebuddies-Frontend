import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Sessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-relatorio-final',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './relatorio-final.html',
  styleUrl: './relatorio-final.css'
})
export class RelatorioFinal implements OnInit {
  modoProgressoAluno = false;
  alunoIdParam: number | null = null;

  // Dados para P6 — Progresso Individual do Aluno
  alunoDetalhe: any = null;
  mapaAluno: any = null;
  conquistasAluno: any = null;
  nivelTituloAluno = 'Iniciante';
  progressoGeralAluno = 0;
  barrasPorNivel: { titulo: string; percentual: number }[] = [];
  todosAlunosTurma: any[] = [];

  // Dados para P8 — Relatórios da Turma (4 blocos)
  turmas: any[] = [];
  turmaSelecionadaId: number | null = null;
  resumoTurma: any = null;
  desempenhoFases: any[] = [];
  boletim: any = null;
  desafiosMaisErrados: any[] = [];

  constructor(
    public sessaoService: Sessao,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.modoProgressoAluno = true;
        this.alunoIdParam = Number(id);
        this.carregarProgressoDoAluno(this.alunoIdParam);
      } else {
        this.modoProgressoAluno = false;
        this.carregarTurmasERelatorios();
      }
    });
  }

  // Seção 6 (P8): Médias null = ninguém jogou -> mostrar "—" (nunca "0")
  formatarValor(valor: number | null | undefined, sufixo = ''): string {
    if (valor === null || valor === undefined) return '—';
    return `${Math.round(valor * 10) / 10}${sufixo}`;
  }

  // ==========================================
  // P6 — PROGRESSO DO ALUNO (/professor/alunos/:id)
  // ==========================================
  carregarProgressoDoAluno(alunoId: number): void {
    forkJoin({
      aluno: this.sessaoService.obterAlunoPorId(alunoId),
      mapa: this.sessaoService.obterMapaDoAluno(alunoId),
      conquistas: this.sessaoService.obterConquistasDoAluno(alunoId)
    }).subscribe({
      next: ({ aluno, mapa, conquistas }) => {
        this.alunoDetalhe = aluno;
        this.mapaAluno = mapa;
        this.conquistasAluno = conquistas;

        const fases: any[] = mapa?.fases || [];
        const total = conquistas?.totalFases ?? fases.length ?? 0;
        const concluidas = conquistas?.fasesConcluidas ?? mapa?.fasesConcluidas ?? 0;
        this.progressoGeralAluno = total > 0 ? Math.round((concluidas / total) * 100) : 0;

        const faseNivelAtual = fases.find(f => f.nivelOrdem === mapa?.nivelAtual);
        this.nivelTituloAluno = faseNivelAtual?.nivelTitulo || `Nível ${mapa?.nivelAtual || 1}`;

        // Agrupa fases por nivelTitulo conforme Seção 6 (P6)
        const grupos = new Map<string, { concluidas: number; total: number }>();
        for (const f of fases) {
          const chave = f.nivelTitulo || `Nível ${f.nivelOrdem}`;
          const item = grupos.get(chave) || { concluidas: 0, total: 0 };
          item.total++;
          if (f.status === 'CONCLUIDA') item.concluidas++;
          grupos.set(chave, item);
        }

        const barras: { titulo: string; percentual: number }[] = [];
        grupos.forEach((v, k) => {
          barras.push({
            titulo: k,
            percentual: v.total > 0 ? Math.round((v.concluidas / v.total) * 100) : 0
          });
        });
        this.barrasPorNivel = barras;

        if (aluno?.turmaId) {
          this.sessaoService.listarAlunosDaTurma(aluno.turmaId).subscribe(lista => {
            this.todosAlunosTurma = lista;
            this.cdr.detectChanges();
          });
        }
        this.cdr.detectChanges();
      }
    });
  }

  aoTrocarAlunoSelect(event: Event): void {
    const novoId = Number((event.target as HTMLSelectElement).value);
    if (novoId) {
      this.router.navigate(['/professor/alunos', novoId]);
    }
  }

  // ==========================================
  // P8 — RELATÓRIOS (/professor/relatorios)
  // ==========================================
  carregarTurmasERelatorios(): void {
    this.sessaoService.listarTurmas().subscribe({
      next: lista => {
        this.turmas = lista;
        if (lista.length > 0) {
          this.turmaSelecionadaId = lista[0].id;
          this.carregarQuatroBlocosRelatorio();
        }
        this.cdr.detectChanges();
      }
    });
  }

  carregarQuatroBlocosRelatorio(): void {
    if (!this.turmaSelecionadaId) return;
    const id = Number(this.turmaSelecionadaId);

    forkJoin({
      resumo: this.sessaoService.obterRelatorioResumo(id),
      fases: this.sessaoService.obterRelatorioFases(id),
      boletim: this.sessaoService.obterRelatorioBoletim(id),
      errados: this.sessaoService.obterDesafiosMaisErrados(id, 5)
    }).subscribe({
      next: ({ resumo, fases, boletim, errados }) => {
        this.resumoTurma = resumo;
        this.desempenhoFases = fases;
        this.boletim = boletim;
        this.desafiosMaisErrados = errados;
        this.cdr.detectChanges();
      }
    });
  }
}
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sessao, AlunoSessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-ranking-final',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ranking-final.html',
  styleUrl: './ranking-final.css'
})
export class RankingFinal implements OnInit {
  rankingDisponivel = true;
  mensagemIndisponivel = 'O ranking aparece quando o professor encerrar a aula';
  ranking: AlunoSessao[] = [];

  constructor(private sessaoService: Sessao, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sessaoService.carregarRankingDaSessao().subscribe(res => {
      this.rankingDisponivel = res.disponivel;
      if (res.mensagem) this.mensagemIndisponivel = res.mensagem;
      this.ranking = res.itens;
      this.cdr.detectChanges();
    });
  }

  get primeiro(): AlunoSessao | undefined { return this.ranking[0]; }
  get segundo(): AlunoSessao | undefined { return this.ranking[1]; }
  get terceiro(): AlunoSessao | undefined { return this.ranking[2]; }
  get demais(): AlunoSessao[] { return this.ranking.slice(3); }
}
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sessao, AlunoSessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-ranking-final',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ranking-final.html',
  styleUrl: './ranking-final.css'
})
export class RankingFinal implements OnInit {
  sessaoAberta = true;
  nomeTurma = '';
  ranking: AlunoSessao[] = [];

  constructor(private sessaoService: Sessao) {}

  ngOnInit(): void {
    this.sessaoService.verificarSessaoAberta().subscribe(res => {
      this.sessaoAberta = res.aberta;
      this.nomeTurma = res.turma;
    });
    this.ranking = this.sessaoService.obterRanking();
  }
}
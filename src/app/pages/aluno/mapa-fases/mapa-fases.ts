import { Component, OnInit } from '@angular/core';
import { Sessao, Fase } from '../../../core/services/sessao';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mapa-fases',
  standalone: true,
  imports: [RouterLink, CommonModule], // <-- Adicione RouterLink aqui!
  templateUrl: './mapa-fases.html',
  styleUrl: './mapa-fases.css',
})
export class MapaFases implements OnInit {
  aluno: any = null;
  fases: Fase[] = [];
  totalEstrelas = 0;

  constructor(private sessaoService: Sessao, private router: Router) {}

  ngOnInit(): void {
    this.aluno = this.sessaoService.obterAlunoLogado();
    if (!this.aluno) {
      this.router.navigate(['/entrar']);
      return;
    }
    this.fases = this.sessaoService.obterFases();
    this.totalEstrelas = this.fases.reduce((soma, f) => soma + f.estrelas, 0);
  }

  iniciarFase(fase: Fase): void {
    // Regra RF-P05 / RF-P07: Só pode acessar fase que não esteja bloqueada
    if (fase.status === 'bloqueada') {
      return;
    }
    this.router.navigate(['/fase', fase.id]);
  }

  sair(): void {
    this.router.navigate(['/entrar']);
  }
}
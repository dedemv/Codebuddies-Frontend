import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Sessao, Fase } from '../../../core/services/sessao';

@Component({
  selector: 'app-perfil-aluno',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './perfil-aluno.html',
  styleUrl: './perfil-aluno.css'
})
export class PerfilAluno implements OnInit {
  aluno: any = null;
  fases: Fase[] = [];
  totalEstrelas = 0;
  historico: any[] = [];

  constructor(private sessaoService: Sessao, private router: Router) {}

  ngOnInit(): void {
    this.aluno = this.sessaoService.obterAlunoLogado();
    if (!this.aluno) {
      this.router.navigate(['/entrar']);
      return;
    }
    this.fases = this.sessaoService.obterFases();
    this.totalEstrelas = this.sessaoService.obterTotalEstrelas();
    this.historico = this.sessaoService.obterHistorico();
  }
}
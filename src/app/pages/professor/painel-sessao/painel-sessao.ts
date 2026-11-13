import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Sessao, AlunoSessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-painel-sessao',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './painel-sessao.html',
  styleUrl: './painel-sessao.css'
})
export class PainelSessao implements OnInit {
  sessaoAberta = true;
  nomeTurma = '';
  alunos: AlunoSessao[] = [];
  termoBusca = '';
  filtroStatus = 'todos';
  confirmandoEncerramento = false;

  constructor(private sessaoService: Sessao, private router: Router) {}

  ngOnInit(): void {
    this.atualizarDados();
  }

  atualizarDados(): void {
    this.sessaoService.verificarSessaoAberta().subscribe(res => {
      this.sessaoAberta = res.aberta;
      this.nomeTurma = res.turma;
    });
    this.alunos = this.sessaoService.obterAlunosDaSessao();
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
    this.sessaoService.abrirSessao(this.nomeTurma);
    this.atualizarDados();
  }

  confirmarEncerramento(): void {
    this.sessaoService.encerrarSessao();
    this.confirmandoEncerramento = false;
    this.atualizarDados();
    this.router.navigate(['/ranking']);
  }

  alternarStatus(id: number): void {
    this.sessaoService.alternarStatusAluno(id);
    this.atualizarDados();
  }
}
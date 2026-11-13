import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Sessao, AlunoSessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-painel-sessao',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './painel-sessao.html',
  styleUrl: './painel-sessao.css'
})
export class PainelSessao implements OnInit {
  sessaoAberta = true;
  nomeTurma = '';
  alunos: AlunoSessao[] = [];
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

  // UC 04: Criar e Abrir Sessão de Aula
  criarEAbrirSessao(): void {
    this.sessaoService.abrirSessao(this.nomeTurma);
    this.atualizarDados();
  }

  // UC 05: Confirmar e Encerrar Sessão + Ir para o Ranking Final
  confirmarEncerramento(): void {
    this.sessaoService.encerrarSessao();
    this.confirmandoEncerramento = false;
    this.atualizarDados();
    this.router.navigate(['/ranking']);
  }

  // UC 06: Desativar / Reativar Aluno sem apagar histórico
  alternarStatus(id: number): void {
    this.sessaoService.alternarStatusAluno(id);
    this.atualizarDados();
  }
}
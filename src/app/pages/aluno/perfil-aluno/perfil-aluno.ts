import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Sessao, Fase, AlunoSessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-perfil-aluno',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './perfil-aluno.html',
  styleUrl: './perfil-aluno.css'
})
export class PerfilAluno implements OnInit {
  alunoLogado: any = null;
  alunosTurma: AlunoSessao[] = [];
  alunoSelecionadoId: number = 0;

  fases: Fase[] = [];
  totalEstrelas = 0;
  fasesConcluidasCount = 8;
  totalFasesCount = 10;

  // Barras de habilidades idênticas ao protótipo "Progressos"
  metricasHabilidades = [
    { nome: 'Progresso geral', percentual: 80, cor: 'azul' },
    { nome: 'Lógica de programação', percentual: 70, cor: 'roxo-claro' },
    { nome: 'Comandos básicos', percentual: 85, cor: 'azul-forte' },
    { nome: 'Loops', percentual: 60, cor: 'roxo' },
    { nome: 'Projetos', percentual: 40, cor: 'lilás' }
  ];

  constructor(private sessaoService: Sessao, private router: Router) {}

  ngOnInit(): void {
    this.alunoLogado = this.sessaoService.obterAlunoLogado();
    this.alunosTurma = this.sessaoService.obterAlunosDaSessao();
    this.fases = this.sessaoService.obterFases();
    this.totalEstrelas = this.sessaoService.obterTotalEstrelas();

    // Se houver aluno logado, usa os dados dele; senão mostra o primeiro da turma (ex: Lucas Silva)
    if (!this.alunoLogado && this.alunosTurma.length > 1) {
      this.selecionarAlunoDaLista(this.alunosTurma[1]);
    } else if (this.alunoLogado) {
      this.atualizarBarras(this.alunoLogado.nome, this.alunoLogado.idade, 'Programador', this.alunoLogado.personagem?.icone || '🐸', 80);
    }
  }

  aoTrocarFiltro(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    if (id === 0 && this.alunoLogado) {
      this.atualizarBarras(this.alunoLogado.nome, this.alunoLogado.idade, 'Programador', this.alunoLogado.personagem?.icone || '🐸', 80);
    } else {
      const encontrado = this.alunosTurma.find(a => a.id === id);
      if (encontrado) this.selecionarAlunoDaLista(encontrado);
    }
  }

  selecionarAlunoDaLista(aluno: AlunoSessao): void {
    this.alunoLogado = {
      nome: aluno.nome,
      idade: aluno.idade,
      cargoNivel: aluno.cargoNivel,
      personagem: aluno.personagem,
      estrelas: aluno.estrelasTotal
    };
    this.atualizarBarras(aluno.nome, aluno.idade, aluno.cargoNivel, aluno.personagem.icone, aluno.progressoPct);
  }

  private atualizarBarras(nome: string, idade: number, nivel: string, icone: string, basePct: number): void {
    this.metricasHabilidades = [
      { nome: 'Progresso geral', percentual: basePct, cor: 'azul' },
      { nome: 'Lógica de programação', percentual: Math.max(30, basePct - 10), cor: 'roxo-claro' },
      { nome: 'Comandos básicos', percentual: Math.min(100, basePct + 5), cor: 'azul-forte' },
      { nome: 'Loops', percentual: Math.max(20, basePct - 20), cor: 'roxo' },
      { nome: 'Projetos', percentual: Math.max(15, basePct - 40), cor: 'lilás' }
    ];
  }
}
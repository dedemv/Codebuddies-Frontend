import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sessao, AlunoSessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-relatorio-final',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './relatorio-final.html',
  styleUrl: './relatorio-final.css'
})
export class RelatorioFinal implements OnInit {
  turma = '';
  alunos: AlunoSessao[] = [];
  mediaEstrelas = 0;

  constructor(private sessaoService: Sessao) {}

  ngOnInit(): void {
    this.sessaoService.verificarSessaoAberta().subscribe(res => this.turma = res.turma);
    // RF-D11 e CA10: Inclui todos os alunos (ativos e desativados permanecem nos relatórios)
    this.alunos = this.sessaoService.obterAlunosDaSessao();
    if (this.alunos.length > 0) {
      const soma = this.alunos.reduce((acc, a) => acc + a.estrelasTotal, 0);
      this.mediaEstrelas = Math.round((soma / this.alunos.length) * 10) / 10;
    }
  }
}
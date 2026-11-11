import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Sessao, Personagem } from '../../../core/services/sessao';

@Component({
  selector: 'app-selecao-personagem',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './selecao-personagem.html',
  styleUrl: './selecao-personagem.css'
})
export class SelecaoPersonagem implements OnInit {
  personagens: Personagem[] = [];
  totalEstrelas = 0;
  selecionado: Personagem | null = null;

  constructor(private sessaoService: Sessao, private router: Router) {}

  ngOnInit(): void {
    const aluno = this.sessaoService.obterAlunoLogado();
    if (!aluno) {
      this.router.navigate(['/entrar']);
      return;
    }
    this.personagens = this.sessaoService.personagens;
    this.totalEstrelas = this.sessaoService.obterTotalEstrelas();
    this.selecionado = aluno.personagem;
  }

  escolher(p: Personagem): void {
    if (this.totalEstrelas < p.estrelasNecessarias) return;
    this.selecionado = p;
    this.sessaoService.selecionarPersonagem(p);
  }

  confirmar(): void {
    this.router.navigate(['/mapa']);
  }
}
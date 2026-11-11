import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Sessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-login-aluno',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login-aluno.html',
  styleUrl: './login-aluno.css'
})
export class LoginAluno implements OnInit {
  sessaoAberta = false;
  nome = '';
  idade: number | null = null;
  erroMensagem = '';

  constructor(private sessaoService: Sessao, private router: Router) {}

  ngOnInit(): void {
    this.sessaoService.verificarSessaoAberta().subscribe(res => {
      this.sessaoAberta = res.aberta;
    });
  }

  entrar(): void {
    // Validação CA02: Se o nome estiver vazio, exibir "Digite seu nome"
    if (!this.nome || this.nome.trim() === '') {
      this.erroMensagem = 'Digite seu nome';
      return;
    }

    // Validação RF-P02 / T2: Verificar se a idade foi preenchida
    if (!this.idade) {
      this.erroMensagem = 'Digite sua idade';
      return;
    }

    this.erroMensagem = '';
    this.sessaoService.entrarNaSessao(this.nome.trim(), this.idade).subscribe(() => {
      this.router.navigate(['/mapa']);
    });
  }
}
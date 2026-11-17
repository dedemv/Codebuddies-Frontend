import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Sessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-login-professor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-professor.html',
  styleUrl: './login-professor.css'
})
export class LoginProfessor {
  email = '';
  senha = '';
  erro = '';
  carregando = false;

  constructor(
    private sessaoService: Sessao,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  entrar(): void {
    this.erro = '';
    if (!this.email.trim() || !this.senha) {
      this.erro = 'Digite seu e-mail e senha.';
      return;
    }

    this.carregando = true;
    this.sessaoService.loginProfessor(this.email.trim(), this.senha).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigate(['/professor']);
      },
      error: (err) => {
        this.carregando = false;
        const apiErr = err?.error?.error;
        const code = apiErr?.code;

        if (code === 'CREDENCIAIS_INVALIDAS') {
          this.erro = apiErr?.message || 'E-mail ou senha incorretos';
        } else if (code === 'MUITAS_TENTATIVAS') {
          this.erro = apiErr?.message || 'Aguarde um minuto e tente novamente';
        } else {
          this.erro = apiErr?.message || 'Não foi possível autenticar agora.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
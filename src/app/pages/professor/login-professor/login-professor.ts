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
  pin = '';
  erro = '';

  constructor(
    private sessaoService: Sessao,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  entrar(): void {
    this.erro = '';
    // Tenta autenticar no back-end com o professor padrão do .env
    this.sessaoService.loginProfessor('professor@codebuddies.com', this.pin).subscribe({
      next: () => {
        this.router.navigate(['/professor/painel']);
      },
      error: () => {
        // Fallback local se digitar 1234 ou changeme
        if (this.pin === '1234' || this.pin === 'changeme') {
          this.router.navigate(['/professor/painel']);
        } else {
          this.erro = 'E-mail ou senha incorretos (Use 1234)';
          this.cdr.detectChanges();
        }
      }
    });
  }
}
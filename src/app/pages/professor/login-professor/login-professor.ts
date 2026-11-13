import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-professor',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login-professor.html',
  styleUrl: './login-professor.css'
})
export class LoginProfessor {
  pin = '';
  erro = '';

  constructor(private router: Router) {}

  entrar(): void {
    // PIN padrão para teste: 1234
    if (this.pin === '1234') {
      this.erro = '';
      this.router.navigate(['/professor/painel']);
    } else {
      this.erro = 'PIN incorreto! (Use 1234 para testar)';
    }
  }
}
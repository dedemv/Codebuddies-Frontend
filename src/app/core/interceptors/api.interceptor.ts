import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Usa o token do professor se for rota administrativa, ou o token do aluno (sessionStorage)
  const tokenAluno = sessionStorage.getItem('cb_token_aluno');
  const tokenProf = sessionStorage.getItem('cb_token_professor');
  const token = req.url.includes('/professor') || req.url.includes('/turmas') || req.url.includes('/relatorios')
    ? (tokenProf || tokenAluno)
    : (tokenAluno || tokenProf);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const code = err?.error?.error?.code;

      // Tratamento centralizado conforme Seção 5 do GUIA_FRONT.md
      if (code === 'NAO_AUTENTICADO' || code === 'TOKEN_INVALIDO' || code === 'ALUNO_FORA_DA_SESSAO') {
        sessionStorage.removeItem('cb_token_aluno');
        router.navigate(['/entrar']);
      } else if (code === 'FASE_BLOQUEADA') {
        router.navigate(['/mapa']);
      }

      return throwError(() => err);
    })
  );
};
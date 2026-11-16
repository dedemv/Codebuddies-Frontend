import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const isBrowser = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';

  const tokenAluno = isBrowser ? sessionStorage.getItem('cb_token_aluno') : null;
  const tokenProf = isBrowser ? sessionStorage.getItem('cb_token_professor') : null;

  const isRotaProfessor =
    req.url.includes('/professor') ||
    req.url.includes('/turmas') ||
    req.url.includes('/sessoes') ||
    req.url.includes('/alunos') ||
    req.url.includes('/relatorios');

  const token = isRotaProfessor ? (tokenProf || tokenAluno) : (tokenAluno || tokenProf);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const code = err?.error?.error?.code;

      if (isBrowser) {
        // Só redireciona para /entrar se for uma rota exclusiva do jogo do aluno (/api/jogo/...)
        if (
          req.url.includes('/jogo/') &&
          (code === 'NAO_AUTENTICADO' || code === 'TOKEN_INVALIDO' || code === 'ALUNO_FORA_DA_SESSAO')
        ) {
          sessionStorage.removeItem('cb_token_aluno');
          router.navigate(['/entrar']);
        } else if (code === 'FASE_BLOQUEADA') {
          router.navigate(['/mapa']);
        }
      }

      return throwError(() => err);
    })
  );
};
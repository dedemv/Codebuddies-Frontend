import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Sessao } from '../services/sessao';

const ROTAS_PUBLICAS = [
  '/api/health',
  '/api/sessoes/aberta',
  '/api/auth/aluno/entrar',
  '/api/auth/professor/login'
];

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const sessao = inject(Sessao);
  const router = inject(Router);

  const isPublica = ROTAS_PUBLICAS.some(rota => req.url.endsWith(rota));
  const token = sessao.token;

  if (!isPublica && token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const apiErr = err.error?.error;
      const code: string | undefined = apiErr?.code;

      switch (code) {
        case 'NAO_AUTENTICADO':
        case 'TOKEN_INVALIDO':
        case 'ALUNO_FORA_DA_SESSAO': {
          const eraProfessor = sessao.perfil === 'PROFESSOR';
          sessao.limparSessao();
          router.navigate([eraProfessor ? '/professor/login' : '/']);
          break;
        }

        case 'SEM_PERMISSAO':
          router.navigate([sessao.perfil === 'PROFESSOR' ? '/professor' : '/aluno/inicio']);
          break;

        case 'SESSAO_FECHADA':
          // A aula acabou: o aluno vai para o ranking (sem apagar a sessão, senão perde o sessaoId do ranking)
          if (sessao.perfil === 'ALUNO') {
            router.navigate(['/aluno/ranking']);
          }
          break;

        case 'FASE_BLOQUEADA':
          router.navigate(['/aluno/fases']);
          break;

        // FASE_SEM_DESAFIOS: não redireciona — a tela "Jogar" mostra a mensagem com o botão "Voltar ao Mapa"

        case 'JSON_INVALIDO':
        case 'DESAFIO_FORA_DA_FASE':
        case 'RESPOSTA_DUPLICADA':
          console.error('[Erro de Contrato do Front]:', apiErr);
          break;
      }

      return throwError(() => err);
    })
  );
};
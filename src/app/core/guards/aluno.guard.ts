import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sessao } from '../services/sessao';

export const alunoGuard: CanActivateFn = () => {
  const sessaoService = inject(Sessao);
  const router = inject(Router);

  if (sessaoService.isAlunoLogado()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
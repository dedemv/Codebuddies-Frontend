import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sessao } from '../services/sessao';

export const professorGuard: CanActivateFn = () => {
  const sessaoService = inject(Sessao);
  const router = inject(Router);

  if (sessaoService.isProfessorLogado()) {
    return true;
  }

  return router.createUrlTree(['/professor/login']);
};
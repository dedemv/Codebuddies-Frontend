import { Routes } from '@angular/router';
import { LoginAluno } from './pages/aluno/login-aluno/login-aluno';
import { SelecaoPersonagem } from './pages/aluno/selecao-personagem/selecao-personagem';
import { MapaFases } from './pages/aluno/mapa-fases/mapa-fases';
import { JogarFase } from './pages/aluno/jogar-fase/jogar-fase';
import { PerfilAluno } from './pages/aluno/perfil-aluno/perfil-aluno';
import { RankingFinal } from './pages/compartilhado/ranking-final/ranking-final';
import { LoginProfessor } from './pages/professor/login-professor/login-professor';
import { PainelSessao } from './pages/professor/painel-sessao/painel-sessao';
import { RelatorioFinal } from './pages/professor/relatorio-final/relatorio-final';
import { professorGuard } from './core/guards/professor.guard';
import { alunoGuard } from './core/guards/aluno.guard';

export const routes: Routes = [
  // A1 - Entrada do aluno (público)
  { path: '', component: LoginAluno, pathMatch: 'full' },
  { path: 'entrar', redirectTo: '', pathMatch: 'full' },

  // Rotas oficiais do Aluno (Seção 4 da Especificação)
  { path: 'personagem', component: SelecaoPersonagem, canActivate: [alunoGuard] },
  { path: 'aluno/inicio', component: PerfilAluno, canActivate: [alunoGuard] },
  { path: 'aluno/fases', component: MapaFases, canActivate: [alunoGuard] },
  { path: 'aluno/fases/:id', component: JogarFase, canActivate: [alunoGuard] },
  { path: 'aluno/fases/:id/resultado', component: JogarFase, canActivate: [alunoGuard] },
  { path: 'aluno/conquistas', component: PerfilAluno, canActivate: [alunoGuard] },
  { path: 'aluno/ranking', component: RankingFinal, canActivate: [alunoGuard] },

  // Redirecionamentos de compatibilidade com links antigos do template
  { path: 'mapa', redirectTo: 'aluno/fases', pathMatch: 'full' },
  { path: 'fase/:id', redirectTo: 'aluno/fases/:id', pathMatch: 'full' },
  { path: 'perfil', redirectTo: 'aluno/inicio', pathMatch: 'full' },
  { path: 'ranking', redirectTo: 'aluno/ranking', pathMatch: 'full' },

  // Rotas do Professor (Seção 4 da Especificação)
  { path: 'professor/login', component: LoginProfessor },
  { path: 'professor', component: PainelSessao, canActivate: [professorGuard] },
  { path: 'professor/painel', redirectTo: 'professor', pathMatch: 'full' },
  { path: 'professor/turmas', component: PainelSessao, canActivate: [professorGuard] },
  { path: 'professor/aulas', component: PainelSessao, canActivate: [professorGuard] },
  { path: 'professor/aulas/:id', component: PainelSessao, canActivate: [professorGuard] },
  { path: 'professor/alunos', component: PainelSessao, canActivate: [professorGuard] },
  { path: 'professor/alunos/:id', component: RelatorioFinal, canActivate: [professorGuard] },
  { path: 'professor/fases', component: PainelSessao, canActivate: [professorGuard] },
  { path: 'professor/fases/:id', component: PainelSessao, canActivate: [professorGuard] },
  { path: 'professor/relatorios', component: RelatorioFinal, canActivate: [professorGuard] },
  { path: 'professor/relatorio', redirectTo: 'professor/relatorios', pathMatch: 'full' },
  { path: 'professor/ranking', component: RankingFinal, canActivate: [professorGuard] },
  { path: 'professor/professores', component: PainelSessao, canActivate: [professorGuard] },

  { path: '**', redirectTo: '' }
];
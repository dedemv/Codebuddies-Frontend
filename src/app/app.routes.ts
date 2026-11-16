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

export const routes: Routes = [
  { path: '', redirectTo: 'entrar', pathMatch: 'full' },
  { path: 'entrar', component: LoginAluno },
  { path: 'personagem', component: SelecaoPersonagem },
  { path: 'mapa', component: MapaFases },
  { path: 'fase/:id', component: JogarFase },
  { path: 'perfil', component: PerfilAluno },
  { path: 'ranking', component: RankingFinal },
  { path: 'professor/login', component: LoginProfessor },
  { path: 'professor/painel', component: PainelSessao, canActivate: [professorGuard] },
  { path: 'professor/relatorio', component: RelatorioFinal, canActivate: [professorGuard] },
  { path: '**', redirectTo: 'entrar' }
];
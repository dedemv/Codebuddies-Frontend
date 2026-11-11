import { Routes } from '@angular/router';
import { LoginAluno } from './pages/aluno/login-aluno/login-aluno';
import { SelecaoPersonagem } from './pages/aluno/selecao-personagem/selecao-personagem';
import { MapaFases } from './pages/aluno/mapa-fases/mapa-fases';
import { PerfilAluno } from './pages/aluno/perfil-aluno/perfil-aluno';
import { JogarFase } from './pages/aluno/jogar-fase/jogar-fase';
import { LoginProfessor } from './pages/professor/login-professor/login-professor';
import { PainelSessao } from './pages/professor/painel-sessao/painel-sessao';
import { RankingFinal } from './pages/compartilhado/ranking-final/ranking-final';

export const routes: Routes = [
  { path: '', redirectTo: 'entrar', pathMatch: 'full' },
  
  // Fluxo do Aluno
  { path: 'entrar', component: LoginAluno },
  { path: 'personagem', component: SelecaoPersonagem },
  { path: 'mapa', component: MapaFases },
  { path: 'perfil', component: PerfilAluno },
  { path: 'fase/:id', component: JogarFase },
  
  // Fluxo do Professor
  { path: 'professor/login', component: LoginProfessor },
  { path: 'professor/painel', component: PainelSessao },
  
  // Ranking
  { path: 'ranking', component: RankingFinal }
];
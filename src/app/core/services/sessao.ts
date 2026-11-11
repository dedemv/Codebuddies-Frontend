import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Fase {
  id: number;
  nivel: number;
  titulo: string;
  tipo: 'digitacao' | 'logica' | 'mouse';
  status: 'liberada' | 'bloqueada' | 'concluida';
  estrelas: number;
}

export interface Personagem {
  id: string;
  nome: string;
  icone: string;
  fala: string;
  estrelasNecessarias: number;
}

@Injectable({
  providedIn: 'root'
})
export class Sessao {
  public sessaoAbertaMock = true;

  public personagens: Personagem[] = [
    { id: 'robo-menin', nome: 'Bia Bot (Feminino)', icone: '👩‍🚀', fala: 'Vamos explorar o espaço digital!', estrelasNecessarias: 0 },
    { id: 'robo-menino', nome: 'Leo Bit (Masculino)', icone: '🧑‍🚀', fala: 'Pronto para programar essa missão!', estrelasNecessarias: 0 },
    { id: 'coruja-sabia', nome: 'Coruja Byte', icone: '🦉', fala: 'A lógica é o nosso superpoder!', estrelasNecessarias: 3 },
    { id: 'dragao-code', nome: 'Dragão Pixel', icone: '🐲', fala: 'Você já é um mestre do teclado!', estrelasNecessarias: 6 }
  ];

  private fasesMock: Fase[] = [
    { id: 1, nivel: 1, titulo: 'Fase 1: Caça às Letras', tipo: 'digitacao', status: 'liberada', estrelas: 0 },
    { id: 2, nivel: 1, titulo: 'Fase 2: Clique Rápido', tipo: 'mouse', status: 'bloqueada', estrelas: 0 },
    { id: 3, nivel: 1, titulo: 'Fase 3: Sequência Lógica', tipo: 'logica', status: 'bloqueada', estrelas: 0 }
  ];

  private historicoMock: { faseTitulo: string; estrelas: number; data: string }[] = [];

  constructor(private http: HttpClient) {}

  verificarSessaoAberta(): Observable<{ aberta: boolean }> {
    return of({ aberta: this.sessaoAbertaMock });
  }

  entrarNaSessao(nome: string, idade: number): Observable<any> {
    const atual = this.obterAlunoLogado();
    const aluno = {
      nome,
      idade,
      personagem: atual?.personagem || this.personagens[0]
    };
    localStorage.setItem('aluno_codebuddies', JSON.stringify(aluno));
    return of(aluno);
  }

  selecionarPersonagem(personagem: Personagem): void {
    const aluno = this.obterAlunoLogado();
    if (aluno) {
      aluno.personagem = personagem;
      localStorage.setItem('aluno_codebuddies', JSON.stringify(aluno));
    }
  }

  obterAlunoLogado() {
    if (typeof window === 'undefined') return null;
    const dados = localStorage.getItem('aluno_codebuddies');
    return dados ? JSON.parse(dados) : null;
  }

  obterFases(): Fase[] {
    return this.fasesMock;
  }

  obterTotalEstrelas(): number {
    return this.fasesMock.reduce((soma, f) => soma + f.estrelas, 0);
  }

  obterHistorico() {
    return this.historicoMock;
  }

  salvarResultadoFase(idFase: number, estrelasObtidas: number) {
    const index = this.fasesMock.findIndex(f => f.id === idFase);
    if (index !== -1) {
      const fase = this.fasesMock[index];
      
      // Registra no histórico simplificado (RF-P15)
      this.historicoMock.unshift({
        faseTitulo: fase.titulo,
        estrelas: estrelasObtidas,
        data: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Mantém sempre a maior pontuação (RN06 / CA07)
      if (estrelasObtidas > fase.estrelas) {
        fase.estrelas = estrelasObtidas;
      }

      // Aprova com >= 3 estrelas e libera a próxima (RN05 / CA05)
      if (fase.estrelas >= 3) {
        fase.status = 'concluida';
        if (this.fasesMock[index + 1] && this.fasesMock[index + 1].status === 'bloqueada') {
          this.fasesMock[index + 1].status = 'liberada';
        }
      }
    }
  }
}
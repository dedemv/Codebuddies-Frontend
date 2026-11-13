import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sessao, Fase } from '../../../core/services/sessao';

interface Desafio {
  pergunta: string;
  alvo: string;
  opcoes?: string[];
  dica: string;
}

@Component({
  selector: 'app-jogar-fase',
  standalone: true,
  imports: [],
  templateUrl: './jogar-fase.html',
  styleUrl: './jogar-fase.css'
})
export class JogarFase implements OnInit {
  fase: Fase | undefined;
  desafios: Desafio[] = [];
  indiceAtual = 0;
  acertos = 0;
  erros = 0;

  // Controle de Feedback Visual Imediato (RF-P09)
  feedbackStatus: 'neutro' | 'acerto' | 'erro' = 'neutro';
  mensagemFeedback = '';

  // Controle de Conclusão da Fase (RF-P10, RF-P11, RF-P12)
  faseConcluida = false;
  estrelasObtidas = 0;
  aprovado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessaoService: Sessao,
    private cdr: ChangeDetectorRef // <-- Atualiza a tela automaticamente no modo Zoneless
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarFase(id);
  }

  carregarFase(id: number): void {
    const fases = this.sessaoService.obterFases();
    this.fase = fases.find(f => f.id === id);

    if (!this.fase || this.fase.status === 'bloqueada') {
      this.router.navigate(['/mapa']);
      return;
    }

    this.reiniciarEstado();

    // Configura 5 desafios por fase conforme o tipo (RF-P08)
    if (this.fase.tipo === 'digitacao') {
      this.desafios = [
        { pergunta: 'Aperte no teclado a letra:', alvo: 'A', dica: 'A de Abelha 🐝' },
        { pergunta: 'Aperte no teclado a letra:', alvo: 'E', dica: 'E de Elefante 🐘' },
        { pergunta: 'Aperte no teclado a letra:', alvo: 'I', dica: 'I de Ilha 🏝️' },
        { pergunta: 'Aperte no teclado a letra:', alvo: 'O', dica: 'O de Ovelha 🐑' },
        { pergunta: 'Aperte no teclado a letra:', alvo: 'U', dica: 'U de Urso 🐻' }
      ];
    } else if (this.fase.tipo === 'mouse') {
      this.desafios = [
        { pergunta: 'Clique no botão com a fruta:', alvo: '🍎', opcoes: ['🍎', '🚗', '⚽'], dica: 'É vermelha e doce!' },
        { pergunta: 'Clique no animal que voa:', alvo: '🦋', opcoes: ['🐶', '🦋', '🐢'], dica: 'Tem asas coloridas!' },
        { pergunta: 'Clique no computador:', alvo: '💻', opcoes: ['🍌', '💻', '🎸'], dica: 'Usamos para programar!' },
        { pergunta: 'Clique na estrela brilhante:', alvo: '⭐', opcoes: ['🌧️', '🌵', '⭐'], dica: 'Brilha lá no céu!' },
        { pergunta: 'Clique no robô amigo:', alvo: '🤖', opcoes: ['🤖', '🍕', '👟'], dica: 'É o mascote do CodeBuddies!' }
      ];
    } else {
      this.desafios = [
        { pergunta: 'Qual é o próximo número? 1, 2, 3...', alvo: '4', opcoes: ['4', '7', '9'], dica: 'Vem depois do 3!' },
        { pergunta: 'Complete o padrão: 🟥 🟦 🟥 🟦 ...', alvo: '🟥', opcoes: ['🟥', '🟩', '🟨'], dica: 'Vermelho, Azul, Vermelho, Azul...' },
        { pergunta: 'Qual vem depois? 🌞 🌙 🌞 🌙 ...', alvo: '🌞', opcoes: ['🌧️', '🌞', '⛄'], dica: 'Dia, Noite, Dia, Noite...' },
        { pergunta: 'Qual número falta? 2, 4, 6...', alvo: '8', opcoes: ['5', '8', '1'], dica: 'Contando de 2 em 2!' },
        { pergunta: 'Para ligar o PC, primeiro devemos:', alvo: '🔌 Ligar na tomada', opcoes: ['🎮 Jogar', '🔌 Ligar na tomada', '😴 Dormir'], dica: 'Precisa de energia!' }
      ];
    }
    this.cdr.detectChanges();
  }

  reiniciarEstado(): void {
    this.indiceAtual = 0;
    this.acertos = 0;
    this.erros = 0;
    this.feedbackStatus = 'neutro';
    this.mensagemFeedback = '';
    this.faseConcluida = false;
    this.estrelasObtidas = 0;
  }

  // Escuta o teclado para a fase de Digitação (RNF04)
  @HostListener('window:keydown', ['$event'])
  aoDigitar(event: KeyboardEvent): void {
    if (this.fase?.tipo === 'digitacao' && !this.faseConcluida && this.feedbackStatus === 'neutro') {
      const tecla = event.key.toUpperCase();
      if (tecla.length === 1) {
        this.responder(tecla);
      }
    }
  }

  responder(resposta: string): void {
    if (this.feedbackStatus !== 'neutro' || this.faseConcluida) return;

    const desafioAtual = this.desafios[this.indiceAtual];

    if (resposta.toUpperCase() === desafioAtual.alvo.toUpperCase()) {
      this.acertos++;
      this.feedbackStatus = 'acerto';
      this.mensagemFeedback = '🎉 Muito bem! Você acertou!';
    } else {
      this.erros++;
      this.feedbackStatus = 'erro';
      this.mensagemFeedback = `❌ Ops! A resposta certa era ${desafioAtual.alvo}`;
    }

    // Atualiza a tela imediatamente para mostrar o verde/vermelho
    this.cdr.detectChanges();

    // Avança automaticamente após 1 segundo (1000ms) e força atualização da tela
    setTimeout(() => {
      this.feedbackStatus = 'neutro';
      this.mensagemFeedback = '';

      if (this.indiceAtual + 1 < this.desafios.length) {
        this.indiceAtual++;
      } else {
        this.finalizarFase();
      }
      
      // Força o Angular Zoneless a desenhar o próximo desafio na tela na hora!
      this.cdr.detectChanges();
    }, 1000);
  }

  finalizarFase(): void {
    this.faseConcluida = true;
    this.estrelasObtidas = this.acertos;
    this.aprovado = this.estrelasObtidas >= 3;

    if (this.fase) {
      this.sessaoService.salvarResultadoFase(this.fase.id, this.estrelasObtidas);
    }
  }

  refazerFase(): void {
    if (this.fase) {
      this.carregarFase(this.fase.id);
    }
  }

  avancarProximaFase(): void {
    if (this.fase) {
      const proximaId = this.fase.id + 1;
      const fases = this.sessaoService.obterFases();
      const proxima = fases.find(f => f.id === proximaId);
      if (proxima && proxima.status !== 'bloqueada') {
        this.router.navigate(['/fase', proximaId]);
        this.carregarFase(proximaId);
      } else {
        this.voltarAoMenu();
      }
    }
  }

  voltarAoMenu(): void {
    this.router.navigate(['/mapa']);
  }
}
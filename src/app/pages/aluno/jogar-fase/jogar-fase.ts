import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Sessao, Fase, DesafioJogo } from '../../../core/services/sessao';

@Component({
  selector: 'app-jogar-fase',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jogar-fase.html',
  styleUrl: './jogar-fase.css'
})
export class JogarFase implements OnInit {
  faseId = 1;
  faseAtual?: Fase;
  tituloFase = '';
  desafios: DesafioJogo[] = [];
  indiceAtual = 0;

  acertosParciais = 0;
  errosParciais = 0;
  respostasAluno: { desafioId: number; resposta: string; acertou: boolean }[] = [];
  inicioTimestamp = 0;

  feedback: 'acerto' | 'erro' | null = null;
  mensagemFeedback = '';
  respostaSelecionada = '';
  resultadoFinal: any = null;
  erroFase = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessaoService: Sessao,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.faseId = Number(params.get('id') || 1);
      this.iniciarFase();
    });
  }

  iniciarFase(): void {
    this.indiceAtual = 0;
    this.acertosParciais = 0;
    this.errosParciais = 0;
    this.respostasAluno = [];
    this.resultadoFinal = null;
    this.feedback = null;
    this.mensagemFeedback = '';
    this.respostaSelecionada = '';
    this.erroFase = '';
    this.inicioTimestamp = Date.now();

    this.sessaoService.obterFaseComDesafios(this.faseId).subscribe({
      next: (res) => {
        this.faseAtual = res.fase;
        this.tituloFase = `${res.fase.subtitulo}: ${res.fase.titulo}`;
        this.desafios = res.desafios || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erroFase = err?.error?.error?.message || 'Esta fase ainda não está pronta.';
        this.cdr.detectChanges();
      }
    });
  }

  get desafioAtual(): DesafioJogo | undefined {
    return this.desafios[this.indiceAtual];
  }

  get progressoPct(): number {
    return this.desafios.length ? Math.round((this.indiceAtual / this.desafios.length) * 100) : 0;
  }

  @HostListener('window:keydown', ['$event'])
  aoPressionarTecla(event: KeyboardEvent): void {
    if (this.resultadoFinal || this.feedback || !this.desafioAtual) return;
    if (this.faseId === 1) {
      const tecla = event.key.toUpperCase();
      if (/^[A-Z0-9]$/.test(tecla)) {
        this.responder(tecla);
      }
    }
  }

  responder(valor: string): void {
    if (this.feedback || !this.desafioAtual || this.resultadoFinal) return;

    this.respostaSelecionada = valor;
    const acertou = valor.trim().toUpperCase() === this.desafioAtual.alvo.trim().toUpperCase();

    if (acertou) {
      this.acertosParciais++;
      this.feedback = 'acerto';
      this.mensagemFeedback = '🎉 Muito bem! Você acertou!';
    } else {
      this.errosParciais++;
      this.feedback = 'erro';
      this.mensagemFeedback = `❌ Ops! A resposta correta era: ${this.desafioAtual.alvo}`;
    }

    this.respostasAluno.push({
      desafioId: this.desafioAtual.id,
      resposta: valor,
      acertou
    });

    this.cdr.detectChanges();

    setTimeout(() => {
      this.feedback = null;
      this.mensagemFeedback = '';
      this.respostaSelecionada = '';

      if (this.indiceAtual + 1 < this.desafios.length) {
        this.indiceAtual++;
        this.cdr.detectChanges();
      } else {
        this.finalizarFase();
      }
    }, 1200);
  }

  finalizarFase(): void {
    const tempoSegundos = Math.max(1, Math.round((Date.now() - this.inicioTimestamp) / 1000));
    this.sessaoService.enviarRespostasFase(this.faseId, tempoSegundos, this.respostasAluno).subscribe(res => {
      this.resultadoFinal = res;
      this.cdr.detectChanges();
    });
  }

  refazerFase(): void {
    this.iniciarFase();
  }

  irProximaFase(): void {
    const proximoId = this.resultadoFinal?.proximaFaseId || (this.faseId < 5 ? this.faseId + 1 : null);
    if (proximoId && proximoId <= 5) {
      this.router.navigate(['/fase', proximoId]);
    } else {
      this.router.navigate(['/mapa']);
    }
  }

  voltarAoMapa(): void {
    this.router.navigate(['/mapa']);
  }
}
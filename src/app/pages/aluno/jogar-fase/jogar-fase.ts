import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Sessao, DesafioJogo } from '../../../core/services/sessao';

@Component({
  selector: 'app-jogar-fase',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './jogar-fase.html',
  styleUrl: './jogar-fase.css'
})
export class JogarFase implements OnInit {
  faseId = 1;
  faseAtual: any = null;
  tituloFase = '';
  desafios: DesafioJogo[] = [];
  indiceAtual = 0;

  respostaDigitada = '';
  respostasAluno: { desafioId: number; resposta: string }[] = [];
  inicioTimestamp = 0;

  carregando = true;
  enviando = false;
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
      const naRotaResultado = this.router.url.endsWith('/resultado');
      const salvo = this.sessaoService.ultimoResultadoTentativa();

      if (naRotaResultado && salvo && salvo.faseId === this.faseId) {
        this.resultadoFinal = salvo;
        this.carregando = false;
        this.cdr.detectChanges();
      } else {
        this.iniciarFase();
      }
    });
  }

  iniciarFase(): void {
    this.indiceAtual = 0;
    this.respostaDigitada = '';
    this.respostasAluno = [];
    this.resultadoFinal = null;
    this.erroFase = '';
    this.carregando = true;
    this.enviando = false;
    this.inicioTimestamp = Date.now();

    this.sessaoService.obterFaseComDesafios(this.faseId).subscribe({
      next: (res) => {
        this.faseAtual = res.fase;
        const ordem = String(res.fase?.ordem ?? this.faseId).padStart(2, '0');
        this.tituloFase = `FASE ${ordem}: ${res.fase?.titulo || ''}`;
        this.desafios = res.desafios || [];
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.carregando = false;
        const code = err?.error?.error?.code;
        if (code === 'FASE_BLOQUEADA') {
          this.router.navigate(['/aluno/fases']);
          return;
        }
        this.erroFase = err?.error?.error?.message || 'Esta fase ainda não está pronta.';
        this.cdr.detectChanges();
      }
    });
  }

  get desafioAtual(): DesafioJogo | undefined {
    return this.desafios[this.indiceAtual];
  }

  get progressoPct(): number {
    return this.desafios.length ? Math.round(((this.indiceAtual + 1) / this.desafios.length) * 100) : 0;
  }

  // Seção 5 (A4) e Seção 11: Para DIGITACAO captura tecla; Enter confirma resposta
  @HostListener('window:keydown', ['$event'])
  aoPressionarTecla(event: KeyboardEvent): void {
    if (this.resultadoFinal || this.carregando || this.enviando || !this.desafioAtual) return;

    const tag = (event.target as HTMLElement)?.tagName;
    if (event.key === 'Enter' && this.respostaDigitada.trim() !== '') {
      event.preventDefault();
      this.confirmarProximo();
      return;
    }

    if (this.faseAtual?.tipo === 'DIGITACAO' && tag !== 'INPUT') {
      if (event.key.length === 1 && /^[a-zA-Z0-9]$/.test(event.key)) {
        this.respostaDigitada = event.key.toUpperCase();
        this.cdr.detectChanges();
      }
    }
  }

  selecionarOpcao(opcao: string): void {
    this.respostaDigitada = opcao;
    this.confirmarProximo();
  }

  confirmarProximo(): void {
    if (!this.desafioAtual || this.enviando) return;
    const valor = this.respostaDigitada.trim();
    if (!valor) return;

    this.respostasAluno.push({
      desafioId: this.desafioAtual.id,
      resposta: valor
    });

    this.avancarOuFinalizar();
  }

  // Seção 5 (A4): Desafios pulados ficam fora da lista (contam como erro no back)
  pularDesafio(): void {
    if (!this.desafioAtual || this.enviando) return;
    this.avancarOuFinalizar();
  }

  private avancarOuFinalizar(): void {
    this.respostaDigitada = '';
    if (this.indiceAtual + 1 < this.desafios.length) {
      this.indiceAtual++;
      this.cdr.detectChanges();
    } else {
      this.finalizarFase();
    }
  }

  finalizarFase(): void {
    if (this.enviando) return;
    this.enviando = true;
    // Tempo contado em segundo plano (sem cronômetro na tela)
    const tempoSegundos = Math.max(1, Math.round((Date.now() - this.inicioTimestamp) / 1000));

    this.sessaoService.enviarRespostasFase(this.faseId, tempoSegundos, this.respostasAluno).subscribe({
      next: res => {
        this.enviando = false;
        this.resultadoFinal = res;
        this.cdr.detectChanges();
      },
      error: err => {
        this.enviando = false;
        this.erroFase = err?.error?.error?.message || 'Não foi possível enviar suas respostas.';
        this.cdr.detectChanges();
      }
    });
  }

  refazerFase(): void {
    this.sessaoService.ultimoResultadoTentativa.set(null);
    this.iniciarFase();
  }

  irProximaFase(): void {
    const proximoId = this.resultadoFinal?.proximaFaseId;
    if (proximoId) {
      this.router.navigate(['/aluno/fases', proximoId]);
    } else {
      this.router.navigate(['/aluno/fases']);
    }
  }

  voltarAoMapa(): void {
    this.router.navigate(['/aluno/fases']);
  }
}
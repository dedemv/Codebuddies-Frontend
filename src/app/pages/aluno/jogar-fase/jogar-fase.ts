import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Sessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-jogar-fase',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jogar-fase.html',
  styleUrl: './jogar-fase.css'
})
export class JogarFase implements OnInit {
  faseId = 1;
  tituloFase = '';
  desafios: any[] = [];
  indiceAtual = 0;
  respostasAluno: { desafioId: number; resposta: string }[] = [];
  inicioTimestamp = 0;

  feedback: 'acerto' | 'erro' | null = null;
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
    this.respostasAluno = [];
    this.resultadoFinal = null;
    this.erroFase = '';
    this.inicioTimestamp = Date.now();

    this.sessaoService.obterFaseComDesafios(this.faseId).subscribe({
      next: (res) => {
        this.tituloFase = res?.fase?.titulo || `Fase 0${this.faseId}`;
        this.desafios = (res?.desafios || []).map((d: any) => ({
          ...d,
          opcoes: d.opcoes || this.extrairOpcoesDoEnunciado(d.enunciado)
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erroFase = err?.error?.error?.message || 'Esta fase ainda não está pronta.';
        this.cdr.detectChanges();
      }
    });
  }

  private extrairOpcoesDoEnunciado(enunciado: string): string[] {
    const palavras = (enunciado || '').split(' ');
    const ultima = palavras[palavras.length - 1]?.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const letraAlvo = ultima ? ultima[0] : 'A';
    const pool = ['A', 'B', 'C', 'D', 'E', 'G', 'L', 'M', 'P', 'S', 'T'];
    const opcoes = new Set<string>([letraAlvo]);
    for (const l of pool) {
      if (opcoes.size < 4) opcoes.add(l);
    }
    return Array.from(opcoes).sort();
  }

  get desafioAtual(): any {
    return this.desafios[this.indiceAtual];
  }

  get progressoPct(): number {
    return this.desafios.length ? Math.round(((this.indiceAtual) / this.desafios.length) * 100) : 0;
  }

  @HostListener('window:keydown', ['$event'])
  aoPressionarTecla(event: KeyboardEvent): void {
    if (this.resultadoFinal || this.feedback || !this.desafioAtual) return;
    const tecla = event.key.toUpperCase();
    if (/^[A-Z0-9]$/.test(tecla)) {
      this.responder(tecla);
    }
  }

  responder(valor: string): void {
    if (this.feedback || !this.desafioAtual) return;
    this.respostaSelecionada = valor;
    this.respostasAluno.push({
      desafioId: this.desafioAtual.id,
      resposta: valor.toLowerCase()
    });

    this.feedback = 'acerto';
    this.cdr.detectChanges();

    setTimeout(() => {
      this.feedback = null;
      this.respostaSelecionada = '';
      if (this.indiceAtual + 1 < this.desafios.length) {
        this.indiceAtual++;
        this.cdr.detectChanges();
      } else {
        this.finalizarFase();
      }
    }, 900);
  }

  finalizarFase(): void {
    const tempoSegundos = Math.max(1, Math.round((Date.now() - this.inicioTimestamp) / 1000));
    this.sessaoService.enviarRespostasFase(this.faseId, tempoSegundos, this.respostasAluno).subscribe(res => {
      this.resultadoFinal = res;
      this.cdr.detectChanges();
    });
  }

  irProximaFase(): void {
    if (this.resultadoFinal?.proximaFaseId) {
      this.router.navigate(['/fase', this.resultadoFinal.proximaFaseId]);
    } else {
      this.router.navigate(['/mapa']);
    }
  }
}
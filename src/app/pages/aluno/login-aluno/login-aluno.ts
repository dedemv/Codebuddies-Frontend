import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Sessao } from '../../../core/services/sessao';

@Component({
  selector: 'app-login-aluno',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-aluno.html',
  styleUrl: './login-aluno.css'
})
export class LoginAluno implements OnInit, OnDestroy {
  sessaoAberta = true;
  professorLogado = false;
  mostrarModalEntrada = false;
  nome = '';
  idade: number | null = null;
  erroMensagem = '';
  erroNome = '';
  erroIdade = '';

  bannerSemFundoUrl = '/img/logo-banner.png';
  estrelasTotais = 0;
  pontosTotais = 0;
  fasesConcluidas = 0;
  totalFases = 5;

  private timerPolling: any;
  private isBrowser: boolean;

  constructor(
    public sessaoService: Sessao,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.professorLogado = this.sessaoService.isProfessorLogado();
      this.atualizarMetricasResumo();
      this.removerFundoBrancoBanner('/img/logo-banner.png');
      this.checarSessao();

      this.timerPolling = setInterval(() => {
        this.checarSessao();
      }, 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.timerPolling) clearInterval(this.timerPolling);
  }

  private atualizarMetricasResumo(): void {
    const fases = this.sessaoService.obterFases();
    this.totalFases = fases.length;
    this.fasesConcluidas = fases.filter(f => f.status === 'concluida').length;
    this.estrelasTotais = this.sessaoService.obterTotalEstrelas();
    this.pontosTotais = this.sessaoService.obterTotalPontos();
  }

  // Remove automaticamente o fundo branco do PNG/JPG no navegador usando Canvas
  private removerFundoBrancoBanner(src: string): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Se o pixel for branco ou quase branco, deixa transparente
          if (r > 235 && g > 235 && b > 235) {
            data[i + 3] = 0;
          } else if (r > 215 && g > 215 && b > 215 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12) {
            data[i + 3] = Math.round(((235 - r) / 20) * 255);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        this.bannerSemFundoUrl = canvas.toDataURL('image/png');
        this.cdr.detectChanges();
      } catch {}
    };
    img.src = src;
  }

  checarSessao(): void {
    if (!this.isBrowser) return;
    this.professorLogado = this.sessaoService.isProfessorLogado();
    this.sessaoService.verificarSessaoAberta().subscribe(res => {
      this.sessaoAberta = res.aberta;
      this.cdr.detectChanges();
    });
  }

  clicarComecarAventura(): void {
    if (!this.isBrowser) return;
    const jaLogado = this.sessaoService.obterAlunoLogado();
    if (jaLogado && this.nome.trim() === '') {
      this.nome = jaLogado.nome || '';
      this.idade = jaLogado.idade || 6;
    }
    this.mostrarModalEntrada = true;
    this.cdr.detectChanges();
  }

  entrar(): void {
    this.erroMensagem = '';
    this.erroNome = '';
    this.erroIdade = '';

    if (!this.nome || this.nome.trim() === '') {
      this.erroNome = 'Digite seu nome';
      return;
    }
    if (!this.idade || this.idade < 4 || this.idade > 14) {
      this.erroIdade = 'Digite sua idade (5 a 12 anos)';
      return;
    }

    this.sessaoService.entrarNaSessao(this.nome.trim(), this.idade).subscribe({
      next: () => {
        this.mostrarModalEntrada = false;
        this.cdr.detectChanges();
        this.router.navigate(['/mapa']);
      },
      error: (err) => {
        const apiError = err?.error?.error;
        this.erroMensagem = apiError?.message || 'Não foi possível entrar agora.';
        this.cdr.detectChanges();
      }
    });
  }
}
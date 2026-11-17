import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Sessao, Fase } from '../../../core/services/sessao';

@Component({
  selector: 'app-login-aluno',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-aluno.html',
  styleUrl: './login-aluno.css'
})
export class LoginAluno implements OnInit, OnDestroy {
  sessaoAberta = false;
  professorLogado = false;
  alunoLogado: any = null;

  mostrarModalEntrada = false;
  enviando = false;
  nome = '';
  idade: number | null = null;
  idadesDisponiveis = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  erroMensagem = '';
  erroNome = '';
  erroIdade = '';
  mensagemBoasVindas = '';

  bannerSemFundoUrl = '/img/logo-banner.png';

  // Métricas reais vindas de GET /api/jogo/conquistas e GET /api/jogo/mapa (A2)
  estrelasTotais = 0;
  pontosTotais = 0;
  fasesConcluidas = 0;
  totalFases = 0;
  proximaFase: Fase | null = null;
  todasConcluidas = false;

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
      this.alunoLogado = this.sessaoService.obterAlunoLogado();
      this.removerFundoBrancoBanner('/img/logo-banner.png');
      this.checarSessao();

      if (this.alunoLogado) {
        this.carregarDadosMinhaAventura();
      }

      // Seção 5 (A1): Consultar GET /api/sessoes/aberta a cada ~5 s
      this.timerPolling = setInterval(() => {
        this.checarSessao();
      }, 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.timerPolling) clearInterval(this.timerPolling);
  }

  carregarDadosMinhaAventura(): void {
    if (!this.sessaoService.isAlunoLogado()) return;

    forkJoin({
      conquistas: this.sessaoService.carregarConquistas(),
      mapa: this.sessaoService.carregarMapaDoJogo()
    }).subscribe({
      next: ({ conquistas, mapa }) => {
        this.estrelasTotais = conquistas?.estrelasTotais ?? mapa.estrelasTotais ?? 0;
        this.pontosTotais = conquistas?.pontosTotais ?? 0;
        this.fasesConcluidas = conquistas?.fasesConcluidas ?? mapa.fasesConcluidas ?? 0;
        this.totalFases = conquistas?.totalFases ?? mapa.fases.length ?? 0;
        this.todasConcluidas = Boolean(mapa.todasConcluidas);
        this.proximaFase = mapa.fases.find(f => f.status === 'liberada' || f.status === 'LIBERADA') || null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }

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
    this.alunoLogado = this.sessaoService.obterAlunoLogado();

    this.sessaoService.verificarSessaoAberta().subscribe({
      next: res => {
        this.sessaoAberta = res.aberta;
        this.cdr.detectChanges();
      },
      error: () => {
        this.sessaoAberta = false;
        this.cdr.detectChanges();
      }
    });
  }

  clicarComecarAventura(): void {
    if (!this.isBrowser) return;
    // Se já está logado como aluno e há próxima fase liberada, vai direto jogar ou para o início (A2)
    if (this.sessaoService.isAlunoLogado()) {
      if (this.proximaFase) {
        this.router.navigate(['/aluno/fases', this.proximaFase.id]);
      } else {
        this.router.navigate(['/aluno/fases']);
      }
      return;
    }

    this.nome = '';
    this.idade = null;
    this.erroMensagem = '';
    this.erroNome = '';
    this.erroIdade = '';
    this.mostrarModalEntrada = true;
    this.cdr.detectChanges();
  }

  selecionarIdade(valor: number): void {
    this.idade = valor;
    this.erroIdade = '';
  }

  entrar(): void {
    this.erroMensagem = '';
    this.erroNome = '';
    this.erroIdade = '';

    if (!this.nome || this.nome.trim() === '') {
      this.erroNome = 'Digite seu nome';
      return;
    }
    if (!this.idade || this.idade < 4 || this.idade > 15) {
      this.erroIdade = 'Digite sua idade (4 a 15 anos)';
      return;
    }

    this.enviando = true;
    this.sessaoService.entrarNaSessao(this.nome.trim(), this.idade).subscribe({
      next: (res) => {
        this.enviando = false;
        this.mostrarModalEntrada = false;
        this.alunoLogado = this.sessaoService.obterAlunoLogado();

        // Seção 5 (A1): novo: true -> "Bem-vindo(a), Ana!" | novo: false -> "Que bom te ver de novo, Ana!"
        const nomeExibicao = res?.aluno?.nome || this.nome.trim();
        this.mensagemBoasVindas = res?.novo
          ? `Bem-vindo(a), ${nomeExibicao}! 🎉`
          : `Que bom te ver de novo, ${nomeExibicao}! 👋`;

        this.carregarDadosMinhaAventura();
        this.cdr.detectChanges();
        this.router.navigate(['/aluno/inicio']);
      },
      error: (err) => {
        this.enviando = false;
        const apiError = err?.error?.error;
        const code = apiError?.code;

        if (code === 'DADOS_INVALIDOS') {
          const fieldErrors = apiError?.details?.fieldErrors;
          if (fieldErrors?.nome?.length) this.erroNome = fieldErrors.nome[0];
          if (fieldErrors?.idade?.length) this.erroIdade = fieldErrors.idade[0];
        } else if (code === 'SESSAO_FECHADA') {
          this.sessaoAberta = false;
          this.mostrarModalEntrada = false;
        } else if (code === 'ALUNO_DESATIVADO') {
          this.erroMensagem = apiError?.message || 'Fale com o professor.';
        } else {
          this.erroMensagem = apiError?.message || 'Não foi possível entrar agora.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  sair(): void {
    this.sessaoService.sair();
    this.alunoLogado = null;
    this.estrelasTotais = 0;
    this.pontosTotais = 0;
    this.fasesConcluidas = 0;
    this.totalFases = 0;
    this.proximaFase = null;
    this.cdr.detectChanges();
  }
}
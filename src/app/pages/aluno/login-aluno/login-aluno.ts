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
  mostrarModalEntrada = false;
  nome = '';
  idade: number | null = null;
  erroMensagem = '';
  erroNome = '';
  erroIdade = '';
  mensagemBoasVindas = '';
  private timerPolling: any;
  private isBrowser: boolean;

  constructor(
    private sessaoService: Sessao,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Só executa chamadas HTTP e setInterval se estiver no navegador (evita AbortError no SSR)
    if (this.isBrowser) {
      this.checarSessao();
      this.timerPolling = setInterval(() => {
        if (!this.sessaoAberta) {
          this.checarSessao();
        }
      }, 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.timerPolling) clearInterval(this.timerPolling);
  }

  checarSessao(): void {
    if (!this.isBrowser) return;
    this.sessaoService.verificarSessaoAberta().subscribe(res => {
      this.sessaoAberta = res.aberta;
      this.cdr.detectChanges();
    });
  }

  clicarComecarAventura(): void {
    if (!this.isBrowser) return;
    const jaLogado = this.sessaoService.obterAlunoLogado();
    if (jaLogado && sessionStorage.getItem('cb_token_aluno')) {
      this.router.navigate(['/mapa']);
      return;
    }
    this.mostrarModalEntrada = true;
  }

  entrar(): void {
    this.erroMensagem = '';
    this.erroNome = '';
    this.erroIdade = '';

    if (!this.nome || this.nome.trim() === '') {
      this.erroNome = 'Digite seu nome';
      return;
    }
    if (!this.idade) {
      this.erroIdade = 'Digite sua idade';
      return;
    }

    this.sessaoService.entrarNaSessao(this.nome.trim(), this.idade).subscribe({
      next: (res) => {
        if (res?.novo === false) {
          this.mensagemBoasVindas = 'Que bom te ver de novo!';
        }
        this.mostrarModalEntrada = false;
        this.router.navigate(['/mapa']);
      },
      error: (err) => {
        const apiError = err?.error?.error;
        if (apiError?.code === 'SESSAO_FECHADA') {
          this.sessaoAberta = false;
          this.mostrarModalEntrada = false;
        } else if (apiError?.code === 'DADOS_INVALIDOS' && apiError?.details?.fieldErrors) {
          this.erroNome = apiError.details.fieldErrors.nome?.[0] || '';
          this.erroIdade = apiError.details.fieldErrors.idade?.[0] || '';
        } else {
          this.erroMensagem = apiError?.message || 'Não foi possível entrar agora.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
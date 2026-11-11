import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PainelSessao } from './painel-sessao';

describe('PainelSessao', () => {
  let component: PainelSessao;
  let fixture: ComponentFixture<PainelSessao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelSessao],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelSessao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

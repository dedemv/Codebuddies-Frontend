import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelecaoPersonagem } from './selecao-personagem';

describe('SelecaoPersonagem', () => {
  let component: SelecaoPersonagem;
  let fixture: ComponentFixture<SelecaoPersonagem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelecaoPersonagem],
    }).compileComponents();

    fixture = TestBed.createComponent(SelecaoPersonagem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

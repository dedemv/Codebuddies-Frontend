import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelatorioFinal } from './relatorio-final';

describe('RelatorioFinal', () => {
  let component: RelatorioFinal;
  let fixture: ComponentFixture<RelatorioFinal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioFinal],
    }).compileComponents();

    fixture = TestBed.createComponent(RelatorioFinal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

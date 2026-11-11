import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JogarFase } from './jogar-fase';

describe('JogarFase', () => {
  let component: JogarFase;
  let fixture: ComponentFixture<JogarFase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JogarFase],
    }).compileComponents();

    fixture = TestBed.createComponent(JogarFase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

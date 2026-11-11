import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RankingFinal } from './ranking-final';

describe('RankingFinal', () => {
  let component: RankingFinal;
  let fixture: ComponentFixture<RankingFinal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankingFinal],
    }).compileComponents();

    fixture = TestBed.createComponent(RankingFinal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

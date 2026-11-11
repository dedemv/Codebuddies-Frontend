import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapaFases } from './mapa-fases';

describe('MapaFases', () => {
  let component: MapaFases;
  let fixture: ComponentFixture<MapaFases>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaFases],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaFases);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

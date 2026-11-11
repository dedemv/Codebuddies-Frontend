import { TestBed } from '@angular/core/testing';
import { Tentativa } from './tentativa';

describe('Tentativa', () => {
  let service: Tentativa;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tentativa);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

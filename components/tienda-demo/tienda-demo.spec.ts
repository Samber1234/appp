import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiendaDemo } from './tienda-demo';

describe('TiendaDemo', () => {
  let component: TiendaDemo;
  let fixture: ComponentFixture<TiendaDemo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiendaDemo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiendaDemo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

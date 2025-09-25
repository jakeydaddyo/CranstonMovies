import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonBreakdownComponent } from './season-breakdown.component';

describe('SeasonBreakdownComponent', () => {
  let component: SeasonBreakdownComponent;
  let fixture: ComponentFixture<SeasonBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeasonBreakdownComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

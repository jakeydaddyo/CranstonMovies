import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariableSearchNodeComponent } from './variable-search-node.component';

describe('VariableSearchNodeComponent', () => {
  let component: VariableSearchNodeComponent;
  let fixture: ComponentFixture<VariableSearchNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VariableSearchNodeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VariableSearchNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

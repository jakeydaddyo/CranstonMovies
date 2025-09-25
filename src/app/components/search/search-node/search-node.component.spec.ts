import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchNodeComponent } from './search-node.component';

describe('SearchNodeComponent', () => {
  let component: SearchNodeComponent;
  let fixture: ComponentFixture<SearchNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchNodeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

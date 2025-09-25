import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileSelectorComponentComponent } from './profile-selector-component.component';

describe('ProfileSelectorComponentComponent', () => {
  let component: ProfileSelectorComponentComponent;
  let fixture: ComponentFixture<ProfileSelectorComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfileSelectorComponentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileSelectorComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

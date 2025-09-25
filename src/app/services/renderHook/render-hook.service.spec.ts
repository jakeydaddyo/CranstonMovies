import { TestBed } from '@angular/core/testing';

import { RenderHookService } from './render-hook.service';

describe('RenderHookService', () => {
  let service: RenderHookService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RenderHookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

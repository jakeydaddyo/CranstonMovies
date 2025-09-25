import { TestBed } from '@angular/core/testing';

import { MasterSearchService } from './master-search.service';

describe('MasterSearchService', () => {
  let service: MasterSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MasterSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

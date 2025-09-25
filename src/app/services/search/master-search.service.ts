import { Injectable } from '@angular/core';
import { RenderHookService } from '../renderHook/render-hook.service';

@Injectable({
  providedIn: 'root'
})
export class MasterSearchService {

  constructor(private rHS: RenderHookService) {}

  search(url:string, type:string){
    this.rHS.send('closeMultiThreadByTypes', [
      'master_search_service'
    ]);
    this.rHS.send(`multiThreadedTask`, {
      taskName:'master_search_service',
      params:{
        search:url,
        type
      }
    });
  }
}

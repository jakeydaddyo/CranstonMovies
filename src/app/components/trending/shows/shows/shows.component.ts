import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { RenderHookService } from 'src/app/services/renderHook/render-hook.service';

@Component({
  selector: 'app-shows',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.css']
})
export class ShowsComponent implements AfterViewInit {
  shows:Array<any> = [];
  constructor(private rhs: RenderHookService, private cDR: ChangeDetectorRef){
    rhs.messageHook.subscribe(e=>{
      const a = e.data;
      if (a.eventName !== 'singleThreadedTaskManager') return;
      const {eventData:{status,task,result}} = a;
      if (status !== 'success' || task !== "get_trending_shows") return;
      this.shows = result;
      this.cDR.detectChanges();
    })
  }

ngAfterViewInit(): void {
  this.rhs.send('singleThreadedTask', 'get_trending_shows'); //singleThreadedTask
}
}

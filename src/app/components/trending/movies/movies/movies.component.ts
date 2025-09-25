import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { RenderHookService } from 'src/app/services/renderHook/render-hook.service';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.css']
})

export class MoviesComponent implements AfterViewInit{
  movies:Array<any> = [];
  @Output() selectMovie = new EventEmitter<object>;
  constructor(private rhs: RenderHookService, private cDR: ChangeDetectorRef){
    rhs.messageHook.subscribe(e=>{
      const a = e.data;
      if (a.eventName !== 'singleThreadedTaskManager') return;
      const {eventData:{status,task,result}} = a;
      if (status !== 'success' || task !== "get_trending_movies") return;
      this.movies = result;
      console.log(this.movies);
      this.cDR.detectChanges();
    })
  }
  select(params:object) {
    this.selectMovie.emit(params);
  }
ngAfterViewInit(): void {
  this.rhs.send('singleThreadedTask', 'get_trending_movies'); //singleThreadedTask
}

}

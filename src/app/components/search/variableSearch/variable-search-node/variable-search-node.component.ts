import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { RenderHookService } from 'src/app/services/renderHook/render-hook.service';
import { MasterSearchService } from 'src/app/services/search/master-search.service';

@Component({
  selector: 'app-variable-search-node',
  templateUrl: './variable-search-node.component.html',
  styleUrls: ['./variable-search-node.component.css']
})
export class VariableSearchNodeComponent {
  @Input() searchString: Observable<string>|undefined;
  @Input() searchText: string|undefined;
  @Input() descTab: any;
  @Input() searchOption:string|undefined;
  @Input() optionPicture:string|undefined;
  searchInitiated:boolean = false;
  searchEvent:any = Subscription;
  searchResultMovies:Array<any> = [];
  searchResultTv:Array<any> = [];
  lastSearch:string|null|undefined = null;
  constructor(private rHS: RenderHookService, private cDR: ChangeDetectorRef, private masterSearch:MasterSearchService){
    rHS.messageHook.subscribe(e=>{
      //https://static.gameloop.com/img/26923383ede70fecb8582ea5a965a8ae.png?imageMogr2/thumbnail/172.8x172.8/format/webp
      const a = e.data;
      console.log(a);
      if (a.eventName !== 'singleThreadedTaskManager' && a.eventName !== 'multiThreadedTaskManager') return;
      console.log('task response 1');
      const {eventData:{status,task,result}} = a;
      const realTaskName = task.taskName || task;
      console.log('realTaskName');
      if (status !== 'success') return;
      switch(realTaskName) {
        case `get_${this.searchOption}_search`:
          {
            console.log('variable task return');
            this.searchResultMovies = result.movies;
            this.searchResultTv = result.tv;
            this.searchInitiated = false;
            break;
          }
        case "master_search_service":
          {
            console.log('variable masterSearch');
            console.log(result);
            this.descTab.update(
              {
                item:{
              banner: result.thumbnail,
              showTitle: result.title,
              age: '',
              rating: result.rating,
              genres: result.genres,
              releaseDate: result.release,
              desc: result.desc,
              playUrl: result?.src,
              seasonInfo: result?.seasonInfo?.reverse(),
              sender: result?.sender
            },
            open:true,
            type: result.requestType
          }
            );
            break;
          }
      }
      this.cDR.detectChanges();
    })
  }
  getAllShowDetails(index:number){
    const item = this.searchResultTv[index];
    this.masterSearch.search(item.showLink, 'show');
  }
  getAllMovieDetails(index:number){
    const item = this.searchResultMovies[index];
    this.masterSearch.search(item.movieLink, 'movie');
  }
  initiateSearch(search:string|undefined){
          //delete all search operations for this component
    //check if we should send single or multi-threaded events
    if (this.lastSearch == search) return;
    this.lastSearch = search;
    this.searchInitiated = true;
    this.searchResultMovies = [];
    this.searchResultTv = [];
    this.cDR.detectChanges();
    let threadType = 'multi';
    if (threadType == 'multi') {
      this.rHS.send('closeMultiThreadByTypes', [
        `get_${this.searchOption}_search`
      ]);
    }
    this.rHS.send(`${threadType}ThreadedTask`, {
      taskName:`get_${this.searchOption}_search`,
      params:{
        search
      }
    }); //singleThreadedTask
  }
  ngOnInit(): void {
    this.initiateSearch(this.searchText);
    this.searchEvent = this.searchString?.subscribe(e=>{
      this.initiateSearch(e);
    })
  }
  ngOnDestroy(): void {
    this.searchEvent.unsubscribe();
  }

}

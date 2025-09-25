import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { RenderHookService } from 'src/app/services/renderHook/render-hook.service';

@Component({
  selector: 'app-season-breakdown',
  templateUrl: './season-breakdown.component.html',
  styleUrls: ['./season-breakdown.component.css']
})
export class SeasonBreakdownComponent {

  constructor(private cDR:ChangeDetectorRef, private rHS:RenderHookService){

  }

  @Input() descriptionTab: any;
  @Input() selectedSeason: any;
  @Input() allWatchHistory:any;
  @Input() startTime: any;
  @Input() episodeName: any;
  @Input() episodeNumber: any;
  @Input() forceCDR:any;
  @Output() episodeNameUpdate: EventEmitter<string> = new EventEmitter<string>();
  @Output() episodeNumberUpdate: EventEmitter<number> = new EventEmitter<number>();
  @Output() selectedSeasonUpdate: EventEmitter<number> = new EventEmitter<number>();
  @Output() timeUpdate: EventEmitter<any> = new EventEmitter<any>();

  numbify(input:any){
    this.selectedSeason = parseInt(input);
    this.selectedSeasonUpdate.emit(this.selectedSeason);
    this.cDR.detectChanges();
  }
  invokeShow(season:number, number:number, sender:string) { //can remove this c.1
    const video = this.descriptionTab.item.seasonInfo[season].seasonEpisodes.find((e:any)=>e.episodeNumber == number);
    const videoUrl = video.episodeUrl;
    this.episodeName = video.episodeName;
    this.episodeNumber = video.episodeNumber;
    this.selectedSeason = parseInt(video.parentSeason);
    this.startTime = 0;
    this.episodeNameUpdate.emit(this.episodeName);
    this.episodeNumberUpdate.emit(this.episodeNumber);
    this.selectedSeasonUpdate.emit(this.selectedSeason);
    this.timeUpdate.emit(this.startTime);
    this.cDR.detectChanges();


    console.log(video);
    this.rHS.send('closeMultiThreadByTypes', [
      `soap2day_start_video`
    ]);
    this.rHS.send(`multiThreadedTask`, {
      taskName:`${sender}_start_video`,
      params:{
        search:videoUrl,
        type: 'show'
      }
    });
  }
  existsInWatchHistory(parentName:string, seasonData:any){
    console.log('eIWH');
    console.log(parentName);
    console.log(seasonData);
  return this.allWatchHistory.find((e:any)=>{
    return e.parentName == parentName && parseInt(e.seasonData.s) == parseInt(seasonData.s) && parseInt(e.seasonData.e) == parseInt(seasonData.e)
  }) !== undefined;
  }
  getResumeTime(parentName:string, seasonData:any){
    return this.allWatchHistory.find((e:any)=>{
      return e.parentName == parentName && parseInt(e.seasonData.s) == parseInt(seasonData.s) && parseInt(e.seasonData.e) == parseInt(seasonData.e)
    }).resumeTime;
  }
  getWatchProgress(parentName:string, seasonData:any){ // can remove this function c.1
    return this.allWatchHistory.find((e:any)=>{
      return e.parentName == parentName && parseInt(e.seasonData.s) == parseInt(seasonData.s) && parseInt(e.seasonData.e) == parseInt(seasonData.e)
    }).progress;
  }
  reWatch(seasonNumber:number, episodeNumber:string, sender:string, type:any, time:any, descItem:any){ // can remove this c.1
    this.descriptionTab.update({
      open:false,
      item:descItem,
      type:type,
      season:seasonNumber
    });
    let data = [];
    if (type == 'show'){
      this.startTime = time;
      const video = this.descriptionTab.item.seasonInfo[seasonNumber].seasonEpisodes.find((e:any)=>e.episodeNumber == episodeNumber);
      const videoUrl = video.episodeUrl;
      this.episodeName = video.episodeName;
      this.episodeNumber = video.episodeNumber;
      this.selectedSeason = parseInt(video.parentSeason);
      this.episodeNameUpdate.emit(this.episodeName);
    this.episodeNumberUpdate.emit(this.episodeNumber);
    this.selectedSeasonUpdate.emit(this.selectedSeason);
    this.timeUpdate.emit(time);
    this.cDR.detectChanges();
      this.rHS.send('closeMultiThreadByTypes', [
        `soap2day_start_video`
      ]);
      this.rHS.send(`multiThreadedTask`, {
        taskName:`${sender}_start_video`,
        params:{
          search:videoUrl,
          type: 'show'
        }
      });
      //this.invokeShow(seasonNumber, parseInt(episodeNumber), sender);
    }
  }
}

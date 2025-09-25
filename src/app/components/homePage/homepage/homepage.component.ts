import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { ProfileServiceService } from 'src/app/services/profileService/profile-service.service';
import { RenderHookService } from 'src/app/services/renderHook/render-hook.service';
import { SearchNodeComponent } from '../../search/search-node/search-node.component';


@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements AfterViewInit{

@ViewChild(SearchNodeComponent) search: SearchNodeComponent|undefined;
@ViewChild('videoPlayer') videoPlayer: any;

servers:any = [
  {name:'soap2day', icon:'https://soap2day.to/favicon.ico'},
  {name:'solarmovies', icon:'https://solarmovie-online.cam/favicon.ico'},
  {name:'s2drs', icon:'https://soap2day.rs/images/group_12/theme_1/favicon.png'},
  {name:'hdtoday', icon:'https://img.hdtoday.to/xxrz/400x400/100/c4/93/c49337aa9c92d6fbf56b6b5830c6849c/c49337aa9c92d6fbf56b6b5830c6849c.png'}
];
enabledServers:any = [];
navbarIndex:number = 0;
settingWatchlistRefreshRate = 10000;
currentProfile:any = null;
moviePlaying:boolean = false;
videoSrc:string = '';
itemTypePlaying:string = '';
selectedSeason:number = 0;
 episodeName: string = '';
 episodeNumber: number = 0;
prebuffered:boolean = false;
startTime:number = 0;
timer:any = undefined;
showDetailsShown:boolean = true;
refreshable:boolean = true;
refreshableOccuring:boolean = false;
prebufferedUrl:string = '';
currentlyWatching:any = [];
allWatchHistory:any = [];
descriptionTab:any = {
  open: false,
  item: null,
  type: null,
  update: (full:any)=>{
    this.numbify(full?.season || 0);
    this.descriptionTab.open = full.open;
    this.descriptionTab.type = full.type;
    this.descriptionTab.item = full.item;
    this.cDR.detectChanges();
  }
}
mouseMove(){
  this.showDetailsShown = true;
  console.log('mm')
  if (this.timer !== undefined)
  {
    clearInterval(this.timer);
  }
  const cdr = this.cDR;
  this.timer = setTimeout(()=>{
    this.showDetailsShown = false;
    cdr.detectChanges();
  }, 3500);
  this.cDR.detectChanges();
}
serverSelected(server:string){
  return this.profile.existsInSelectedServers(server);
}
updateStartTime(time:any){
  this.startTime = time;
  this.cDR.detectChanges();
}
updateEpisodeName(name:string){
  this.episodeName = name;
  this.cDR.detectChanges();
}
updateEpisodeNumber(name:number){
  this.episodeNumber = name;
  this.cDR.detectChanges();
}
updateSeasonNumber(name:number){
  this.selectedSeason = name;
  this.cDR.detectChanges();
}

forceCDR(){
  this.cDR.detectChanges();
}

ngAfterViewInit(): void {
  this.getCurrentlyWatching();
}
getResumeTime(parentName:string, seasonData:any){ // can remove this function c.1
  return this.allWatchHistory.find((e:any)=>{
    return e.parentName == parentName && parseInt(e.seasonData.s) == parseInt(seasonData.s) && parseInt(e.seasonData.e) == parseInt(seasonData.e)
  }).resumeTime;
}
getWatchProgress(parentName:string, seasonData:any){ // can remove this function c.1
  return this.allWatchHistory.find((e:any)=>{
    return e.parentName == parentName && parseInt(e.seasonData.s) == parseInt(seasonData.s) && parseInt(e.seasonData.e) == parseInt(seasonData.e)
  }).progress;
}
existsInWatchHistory(parentName:string, seasonData:any){ //can remove this function c.1
  console.log('eIWH');
  console.log(parentName);
  console.log(seasonData);
return this.allWatchHistory.find((e:any)=>{
  return e.parentName == parentName && parseInt(e.seasonData.s) == parseInt(seasonData.s) && parseInt(e.seasonData.e) == parseInt(seasonData.e)
}) !== undefined;
}
reWatch(seasonNumber:any, episodeNumber:any, sender:string, type:any, time:any, descItem:any){ // can remove this c.1
  this.descriptionTab.update({
    open:false,
    item:descItem,
    type:type
  });
  let data = [];
  const allThreadTypes = this.enabledServers.map((e:any)=>`${e.name}_start_video`);
  console.log('aTT');
  console.log(allThreadTypes);
  if (type == 'show'){
    this.startTime = time;
    const video = this.descriptionTab.item.seasonInfo[seasonNumber].seasonEpisodes.find((e:any)=>e.episodeNumber == episodeNumber);
    const videoUrl = video.episodeUrl;
    this.episodeName = video.episodeName;
    this.episodeNumber = video.episodeNumber;
    console.log(`changing season to: ${video.parentSeason}`);
    this.selectedSeason = seasonNumber;
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
  else
  {
    this.startTime = time;
    this.selectedSeason = 0;
    this.itemTypePlaying = 'movie';
    this.moviePlaying = true;
    this.videoSrc = this.descriptionTab.item.playUrl;
    this.cDR.detectChanges();
  }
}
constructor(private rHS: RenderHookService, private profile:ProfileServiceService, private cDR: ChangeDetectorRef){
  this.currentProfile = profile.currentProfile;
rHS.messageHook.subscribe(e => {
  console.log('home component ->');
  const a = e.data;
  console.log(a);
  if (a.eventName !== 'singleThreadedTaskManager' && a.eventName !== 'multiThreadedTaskManager' && a.eventName !== 'advancedStorageOperation') return;
  console.log('task response 1');
  const {eventData:{status,task,result}} = a;
  const realTaskName = task?.taskName || task;
  if (status !== 'success') return;
  switch(realTaskName) {
    case 'soap2day_start_video':
      {
        this.startShow(result);
        break;
      }
      case 'prebuffer_video':
        {

          break;
        }
      case 'getWatchlist':
        {
          let shows:Array<any> = [];
          let movies:Array<any> = [];
          let allShows:Array<any> = [];

          console.log('get watchlist fired');
          Object.keys(result?.show).forEach((item:any)=>{
            //item = showTitle
            const showEpisodes = Object.values(result.show[item]?.episodes);
            const episode = showEpisodes.sort((a:any,b:any)=>{
              return b.exitTime - a.exitTime;
            })?.[0];
            shows.push(episode);
            showEpisodes.forEach(episode=>{
              allShows.push(episode);
            })
          });
          Object.keys(result?.movie).forEach((item:any)=>{
            const details = result.movie[item];
            movies.push(details);
          });

          let allWatchlist = movies.concat(shows).sort((a:any, b:any)=>{
            return b.exitTime - a.exitTime;
          })
          this.currentlyWatching = allWatchlist;
          this.allWatchHistory = allShows;
          console.log(allWatchlist);
          this.cDR.detectChanges();
                }
  }
});

}
getEnabledServers(){
  if (this.profile.userSettings?.search?.activeSearchProviders === undefined) return;
  const settingsSearchProviders = this.profile.userSettings.search.activeSearchProviders
  const a = this.servers.filter((e:any)=>settingsSearchProviders.includes(e.name));
  console.log(a);
  console.log(this.servers)
  return this.servers.filter((e:any)=>settingsSearchProviders.includes(e.name))
}
getCurrentlyWatching() {
  this.rHS.send('advancedStorageOperation',{
    method: 'get',
    dataPath: `watchList/${this.profile.currentProfile.name}`,
    returnOperation: 'getWatchlist'
  });
}
videoPlayerUpdate($event:any, videoPlayer:any) {
  if (this.startTime > 0) {
    console.log('start time greater');
    videoPlayer.currentTime = this.startTime;
    this.startTime = 0;
  }
  else{
    console.log('no luck on start time');
    console.log(this.startTime);
  }
  const totalLength = videoPlayer.duration / 60;
  const actualTime = videoPlayer.currentTime;
  const currProgress = actualTime / 60;
  const percentageCompleted = (currProgress / totalLength) * 100;
  if (this.refreshable) 
  {
    this.refreshable = false;
  }
  else 
  {
    if (!this.refreshableOccuring)
    {
      this.refreshableOccuring = true;
      setTimeout(()=>{
        this.refreshable = true;
        this.refreshableOccuring = false;
      },this.settingWatchlistRefreshRate);
    }
    console.log('refresh gap');
    return;
    //block ended here if cooldown not reached
  }
  console.log('refreshable aSO');
  if (this.descriptionTab.type == 'movie')
  {
    this.rHS.send('advancedStorageOperation',{
      method: 'store',
      dataPath: `watchList/${this.profile.currentProfile.name}/${this.descriptionTab.type}/${this.descriptionTab.item.showTitle.toLowerCase()}`,
      store:{descItem: this.descriptionTab.item, progress:percentageCompleted, parentName:this.descriptionTab.item.showTitle, exitTime:Date.now(), resumeTime:actualTime, type:this.descriptionTab.type}
    });
  }
  else
  {
    console.log('before aSO-');
    console.log(this.descriptionTab);
    console.log(this.episodeName);
    console.log(this.episodeNumber);
    console.log(this.selectedSeason);
    this.rHS.send('advancedStorageOperation',{
      method: 'store',
      dataPath: `watchList/${this.profile.currentProfile.name}/${this.descriptionTab.type}/${this.descriptionTab.item.showTitle.toLowerCase()}/episodes/${this.episodeName.toLowerCase()}`,
      store:{descItem: this.descriptionTab.item, progress:percentageCompleted, seasonData:{s:this.selectedSeason, e:this.episodeNumber}, exitTime:Date.now(), parentName:this.descriptionTab.item.showTitle, childName:this.episodeName, resumeTime:actualTime, type:this.descriptionTab.type}
    });
  }
}
numbify(input:any){
  this.selectedSeason = parseInt(input);
  console.log(this.selectedSeason);
  this.cDR.detectChanges();
}
exitMovie(){
  this.moviePlaying = false;
  this.startTime = 0;
  this.videoSrc = '';
  this.cDR.detectChanges();
  this.getCurrentlyWatching();
  this.showDetailsShown = true;
}
startShow(videoSrc:string){
  this.itemTypePlaying = 'show';
  this.moviePlaying = true;
  this.videoSrc = videoSrc;
  this.cDR.detectChanges();
  //data
}
invokeShow(season:number, number:number, sender:string) { //can remove this c.1
  const video = this.descriptionTab.item.seasonInfo[season].seasonEpisodes.find((e:any)=>e.episodeNumber == number);
  console.log('invoking show:');
  console.log(season);
  console.log(number)
  const videoUrl = video.episodeUrl;
  this.episodeName = video.episodeName;
  this.episodeNumber = video.episodeNumber;
  console.log(video);
  console.log(`changing season to: ${video.parentSeason}`);
  this.selectedSeason = season;
  this.startTime = 0;
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
invokeMovie() {
  console.log('test -- 41');
  if (this.descriptionTab.item?.playUrl === undefined) return;
  this.itemTypePlaying = 'movie';
  this.startTime = 0;
  this.selectedSeason = 0;
  this.moviePlaying = true;
  this.videoSrc = this.descriptionTab.item.playUrl;
  this.cDR.detectChanges();
}
searchItem(item:string){
this.search?.setText(item);
this.search?.swapState(true);
}

incomingMovie($event:any) {
  this.selectedSeason = 0;
  this.descriptionTab.type = 'movie';
  this.descriptionTab.item = $event;
  this.descriptionTab.open = true;
  this.cDR.detectChanges();
}
adjustIndex(index:number){
  this.navbarIndex = index;
  this.cDR.detectChanges();
}
getSetting(settingHome:string, settingName:string){
  return this.profile.getSetting(settingHome, settingName)
}
updateThreadType(style:string){
this.profile.crudeUpdate({settingName:'search-threadType', settingValues:{searchStyle:style}});
this.cDR.detectChanges();
}
updateSelectedServers(server:string){
this.profile.crudeUpdate({settingName:'search-selectedServers', settingValues:{searchServer:server}});
this.cDR.detectChanges();
}
testElectron() {
  this.rHS.send('test', 'test');

}

}

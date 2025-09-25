import { Injectable } from '@angular/core';
import { RenderHookService } from '../renderHook/render-hook.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileServiceService {
  currentProfile:any = null;
  useSettings:string = 'default';
  defaultSettings:any = {
    search:{
      activeSearchProviders:['soap2day'],
      searchStyle:'single'
    },
    main:{
      theme:'default'
    }
  };
  masterSettings:any = {};
  userSettings:any = undefined;
  constructor(private rHS: RenderHookService){
    rHS.messageHook.subscribe(e => {
      const a = e.data;
      console.log(a);
      if (a.eventName !== 'advancedStorageOperation') return;
      const {eventData:{status,task,result}} = a;
      const realTaskName = task?.taskName || task;
      if (status !== 'success') return;
      switch(realTaskName)
      {
        case "getSettings":
          {
            if (result === undefined) {
              this.updateSettings(this.defaultSettings);
              this.useSettings = 'user';
            }
            else
            {
              this.userSettings = result;
              this.useSettings = 'user';
            }
            break;
          }
      }
    });
  }
  existsInSelectedServers(server:string){
    let param;
    if (this.useSettings == 'user') {param = this.userSettings} else {param=this.defaultSettings}
    return param.search.activeSearchProviders.includes(server);
  }
  getSetting(settingHome:string, settingName:string){
    if (this?.userSettings?.[settingHome]?.[settingName] === undefined) return;
    return this.userSettings?.[settingHome]?.[settingName];
  }
  crudeUpdate({settingName, settingValues}:any){
    console.log('settings update');
    console.log(settingName);
    switch(settingName){
      case "search-threadType":
        {
          this.userSettings.searchStyle = settingValues.searchStyle;
          break;
        }
      case "search-selectedServers":
        {
          const searchServer = settingValues.searchServer;
          const settings = this.userSettings.search.activeSearchProviders;
          if (settings.includes(searchServer)) 
          {
            settings.splice(settings.indexOf(searchServer), 1);
          }
          else
          {
            settings.push(searchServer);
          }
          break;
        }
    }
    this.updateSettings(this.userSettings);
  }
  updateSettings(settings:any){
    if (this.currentProfile === undefined) return;
    this.rHS.send('advancedStorageOperation',{
      method: 'store',
      dataPath: `settings/${this.currentProfile.name}`,
      store:settings
    });
    console.log(this.userSettings);
    this.userSettings = settings;
  }
  setProfile(profile:any) {
    this.currentProfile = profile;
    this.rHS.send('advancedStorageOperation',{
      method: 'get',
      dataPath: `settings/${this.currentProfile.name}`,
      returnOperation: 'getSettings'
    });
  }
}

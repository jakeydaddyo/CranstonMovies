import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RenderHookService {
  messageHook = new Subject<any>;
  constructor() {
    const ipcRenderer = (<any>window).ipcRenderer;

    ipcRenderer.on('renderHookCommunication', (e:any, dat:any)=>{
      this.messageHook.next({
        event: e,
        data: dat
      });
    });
  
  }

  send(channel:string, data:any) {
    const {ipcRenderer} = (<any>window).ipcRenderer;
    ipcRenderer.send(channel, data);
  }
}

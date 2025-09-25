import { Injectable } from '@angular/core';
import { ProfileServiceService } from '../profileService/profile-service.service';

@Injectable({
  providedIn: 'root'
})
export class VideoServiceService {

  constructor(private pSS: ProfileServiceService) { }
  watching(args:any) {
    const {type, name, description, genres, rating} = args;
    switch (type) {
      case "show":
        {
          
          break;
        }
    }
  }
  hasWatched(args:any) {
    const {type} = args;
    switch(type){
      case "show":{

      }
    }
  }
}

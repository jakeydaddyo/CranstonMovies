import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProfileServiceService } from 'src/app/services/profileService/profile-service.service';
import { RenderHookService } from 'src/app/services/renderHook/render-hook.service';

@Component({
  selector: 'app-profile-selector-component',
  templateUrl: './profile-selector-component.component.html',
  styleUrls: ['./profile-selector-component.component.css']
})
export class ProfileSelectorComponentComponent implements AfterViewInit, OnDestroy {
  @ViewChild('icons', { read: ElementRef }) icons!: ElementRef;
  renderHookSubscription$;
  accountOption:string = 'main';
  profileName:string = '';
  profilePicture:string = '';
  profiles:Array<any> = [];
constructor(private router: Router, private rHS: RenderHookService, private cDR: ChangeDetectorRef, private profile: ProfileServiceService) {
  const profileOperation = 'profileList';

  rHS.send('storageOperation',{
    method: 'get',
    dataName: 'profiles',
    returnOperation: profileOperation,
  });


  this.renderHookSubscription$ = rHS.messageHook.subscribe(e=>{
    console.log('renderHook update');
    console.log(e);
    const {event, data} = e;
    switch (data.eventName) {
      case profileOperation : 
      {
        const returnProfiles = data.eventData;
        if (returnProfiles !== undefined && returnProfiles.length > 0) {
          this.profiles = returnProfiles;
          this.cDR.detectChanges();
          console.log('profile update');
        }
        break;
      }
    }
  })
}

addProfile(){
  const profileOperation = 'profileList';
  this.rHS.send('storageOperation', {
    method:'store',
    dataName:'profiles',
    overrides:false,
    dataValue:[{name: this.profileName, picture: this.profilePicture}]
  });
  this.rHS.send('storageOperation',{
    method: 'get',
    dataName: 'profiles',
    returnOperation: profileOperation,
  });
  this.accountOption = 'main';
}

selectCharacter($e:any) {
  if ($e.target.nodeName == 'IMG') {
    this.profilePicture = $e.target.src;
  }
console.log($e);
}
ngOnDestroy(): void {
  this.renderHookSubscription$.unsubscribe();
}
ngAfterViewInit(): void {
  const random = this.icons.nativeElement.children.length;
  const rand = Math.floor(Math.random() * random);
  this.profilePicture = this.icons.nativeElement.children[rand].src;
}

nameType(profileName:any) {
this.profileName = profileName.value.length > 0 ? profileName.value : 'Name';
}
profileClick(name:string) {
  this.profile.setProfile(this.profiles.find(e=>e.name == name));
  this.router.navigate(['/home']);
}

}

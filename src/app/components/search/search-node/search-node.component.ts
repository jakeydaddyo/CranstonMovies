import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { ProfileServiceService } from 'src/app/services/profileService/profile-service.service';

@Component({
  selector: 'app-search-node',
  templateUrl: './search-node.component.html',
  styleUrls: ['./search-node.component.css']
})
export class SearchNodeComponent {
  active:boolean = false;
  searchText:string = '';
  @Input() descTab:object|undefined;
  @Input() servers:any;

  searchEvent: Subject<string> = new Subject<string>();
  setText(txt:string){
    this.searchText = txt;
    this.searchEvent.next(txt);
  }
  swapState(state:boolean){
    this.active = state;
    this.cdr.detectChanges();
  }
  constructor(private cdr: ChangeDetectorRef, private profile:ProfileServiceService){

  }

}

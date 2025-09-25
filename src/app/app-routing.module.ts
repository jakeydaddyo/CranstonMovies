import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './components/homePage/homepage/homepage.component';
import { AppComponent } from './app.component';
import { ProfileSelectorComponentComponent } from './components/profileSelector/profile-selector-component/profile-selector-component.component';

const routes: Routes = [
  {
    path:'',
    component: ProfileSelectorComponentComponent
  },
  {
    path:'home',
    component: HomepageComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProfileSelectorComponentComponent } from './components/profileSelector/profile-selector-component/profile-selector-component.component';
import { HomepageComponent } from './components/homePage/homepage/homepage.component';
import { MoviesComponent } from './components/trending/movies/movies/movies.component';
import { ShowsComponent } from './components/trending/shows/shows/shows.component';
import { SearchNodeComponent } from './components/search/search-node/search-node.component';
import { SeasonBreakdownComponent } from './components/homePage/season-breakdown/season-breakdown.component';
import { VariableSearchNodeComponent } from './components/search/variableSearch/variable-search-node/variable-search-node.component';

@NgModule({
  declarations: [
    AppComponent,
    ProfileSelectorComponentComponent,
    HomepageComponent,
    MoviesComponent,
    ShowsComponent,
    SearchNodeComponent,
    SeasonBreakdownComponent,
    VariableSearchNodeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
// import { AppComponent } from './app.component';
// import { HomeComponent } from './home/home.component';
import { LocationComponent } from './location/location.component';
import { LoginComponent } from './login/login.component';
import { MapComponent } from './map/map.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { AuthGuard } from './services/auth.guard';
const routes: Routes = [
  {path:'',pathMatch:'full',redirectTo:'map'},
  {path:'login', component:LoginComponent},
  // {path:'home', component:HomeComponent},
  {path:'map', component:MapComponent},
  {path:'location', component:LocationComponent, canActivate:[AuthGuard]},
  {path:'about', component:AboutComponent},
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  route = []
  constructor(){

  }
 }

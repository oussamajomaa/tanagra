import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent implements OnInit {
  status = localStorage.getItem('status')
  constructor(private router:Router, public auth:AuthService) { }

  ngOnInit(): void {
  }

  // logout(){
  //   localStorage.removeItem('status')
  //   this.router.navigateByUrl('map')
  // }

}

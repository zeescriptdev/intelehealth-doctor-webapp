import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  showSplash = true;

  constructor() { }

  ngOnInit() {
    setTimeout(() => {
      this.showSplash = false;
    }, 1000); 
  }

}

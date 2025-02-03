import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.sass',
  imports: [
    RouterLink,
    NzTypographyModule
  ]
})
export class HomeComponent { }
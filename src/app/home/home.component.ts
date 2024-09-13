import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.sass',
  standalone: true,
  imports: [NzTypographyModule, RouterLink]
})
export class HomeComponent { }
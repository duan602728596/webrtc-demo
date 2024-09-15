import type { Routes } from '@angular/router';
import { ChatroomComponent } from './chatroom/chatroom.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  {
    path: 'chatroom',
    component: ChatroomComponent
  },
  {
    path: '',
    component: HomeComponent
  }
];
import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { ChatroomComponent } from './chatroom/chatroom.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {
    path: 'chatroom',
    component: ChatroomComponent
  },
  {
    path: '',
    component: HomeComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
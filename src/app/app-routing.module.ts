import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { ChatroomComponent } from './chatroom/chatroom.component';

const routes: Routes = [
  {
    path: 'chatroom',
    component: ChatroomComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
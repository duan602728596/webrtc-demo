import { NgModule } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import zh from '@angular/common/locales/zh';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { zh_CN } from 'ng-zorro-antd/i18n';
import { StoreModule } from '@ngrx/store';

// ng-zorro
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

// components
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatroomComponent } from './chatroom/chatroom.component';
import { SendMessageComponent } from './chatroom/send-message/send-message.component';
import { ChatMessageComponent } from './chatroom/chat-message/chat-message.component';

// reducer
import { chatroomReducer } from './chatroom/chatroom.reducer';

registerLocaleData(zh);

@NgModule({
  declarations: [
    AppComponent,
    ChatroomComponent,
    SendMessageComponent,
    ChatMessageComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,

    // reducer
    StoreModule.forRoot({
      chatroom: chatroomReducer
    }),

    // ng-zorro
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzMessageModule,
    NzTagModule
  ],
  providers: [{
    provide: NZ_I18N,
    useValue: zh_CN
  }],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
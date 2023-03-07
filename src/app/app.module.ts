import { NgModule } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import zh from '@angular/common/locales/zh';
import { StoreModule } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { zh_CN } from 'ng-zorro-antd/i18n';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { chatroomReducer } from './chatroom/chatroom.reducer';

registerLocaleData(zh);

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,

    // reducer
    StoreModule.forRoot({
      chatroom: chatroomReducer
    })
  ],
  providers: [
    {
      provide: NZ_I18N,
      useValue: zh_CN
    },
    NzMessageService
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
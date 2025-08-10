import { provideZonelessChangeDetection, type ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { NZ_I18N, zh_CN } from 'ng-zorro-antd/i18n';
import { NzMessageService } from 'ng-zorro-antd/message';
import { routes } from './app.routes';
import { chatroomReducer } from './chatroom/chatroom.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    provideRouter(routes),

    // reducer
    provideStore({
      chatroom: chatroomReducer
    }),

    // ng-zorro-antd
    {
      provide: NZ_I18N,
      useValue: zh_CN
    },
    NzMessageService
  ]
};
import { enableProdMode } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import zh from '@angular/common/locales/zh';
import dayjs from 'dayjs';
import zhCN from 'dayjs/esm/locale/zh-cn';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

registerLocaleData(zh);
dayjs.locale(zhCN); // dayjs locale config

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err: Error): void => console.error(err));
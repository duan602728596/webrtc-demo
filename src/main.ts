import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import dayjs from 'dayjs';
import zhCN from 'dayjs/esm/locale/zh-cn';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

dayjs.locale(zhCN); // dayjs locale config

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch((err: Error): void => console.error(err));
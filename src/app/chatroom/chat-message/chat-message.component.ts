import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { changeTargetIdEvent } from '../../../utils/event';
import type { StoreRecord } from '../../app.interface';
import type { ChatroomInitialState } from '../chatroom.reducer';
import type { ChatRecord } from '../chatroom.interface';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.sass'],
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    NzTagModule,
    NzButtonModule
  ]
})
export class ChatMessageComponent implements OnInit {
  chatroom$State: ChatroomInitialState | undefined;
  chatRecord: Array<ChatRecord> = [];

  constructor(
    private store: Store<StoreRecord>,
    private changeDetection: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { /* noop */ }

  ngOnInit(): void {
    this.store.select('chatroom').subscribe((state: ChatroomInitialState): void => {
      this.chatroom$State = state;
      this.chatRecord = state.chatRecord;
      this.changeDetection.detectChanges();
    });
  }

  /**
   * 返回安全的url地址
   * @param { string } url
   * @return { SafeHtml }
   */
  getSanitizeUrl(url: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  // 点击将targetId赋值给表单
  handleSetTargetIdClick(event: Event, item: ChatRecord): void {
    changeTargetIdEvent['data'] = item;
    document.dispatchEvent(changeTargetIdEvent);
  }
}
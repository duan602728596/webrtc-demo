import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { changeTargetIdEvent } from '../send-message/send-message.component';
import type { InitialState } from '../chatroom.reducer';
import type { ChatRecord } from '../chatroom.interface';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.sass']
})
export class ChatMessageComponent implements OnInit {
  chatroom$State: InitialState | undefined;
  chatRecord: Array<ChatRecord> = [];

  constructor(
    private store: Store<{ chatroom: InitialState }>,
    private changeDetection: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { /* noop */ }

  ngOnInit(): void {
    this.store.select('chatroom').subscribe((state: InitialState): void => {
      this.chatroom$State = state;
      this.chatRecord = [...state.chatRecord];
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
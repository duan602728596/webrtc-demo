import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  chatroom$: Observable<InitialState>;
  chatroomState: InitialState | undefined;
  chatRecord: Array<ChatRecord> = [];

  constructor(
    private store: Store<{ chatroom: InitialState }>,
    private changeDetection: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {
    this.chatroom$ = store.select('chatroom');
  }

  ngOnInit(): void {
    this.chatroom$.subscribe((state: InitialState): void => {
      this.chatroomState = state;
      this.chatRecord = [...state.chatRecord];
      this.changeDetection.detectChanges();
    });
  }

  getSanitizeUrl(url: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  // 点击将targetId赋值给表单
  handleSetTargetIdClick(event: Event, item: ChatRecord): void {
    changeTargetIdEvent['data'] = item;
    document.dispatchEvent(changeTargetIdEvent);
  }
}
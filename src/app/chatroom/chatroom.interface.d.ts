export interface MessageChatRecord {
  type: 'message';
  payload: {
    date: string;
    text: string;
    id: string;
  };
}

export interface ImageChatRecord {
  type: 'image';
  payload: {
    date: string;
    url: string;
    id: string;
  };
}

export type ChatRecord = MessageChatRecord | ImageChatRecord;
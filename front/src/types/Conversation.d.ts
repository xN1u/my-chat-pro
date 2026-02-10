import type { Message } from "./Message"


export interface GetConversationListParams {
    page:      number
    page_size: number
}

export interface ConversationListData {
    conversations: Conversation[];
    page:          number;
    page_size:     number;
    total:         number;
}

export interface Conversation {
    id:          number;
    created_at:  Date;
    updated_at:  Date;
    title:       string;
    user_id:     number;
    last_msg:    string;
    last_msg_at: Date;
    messages:    Message[];
}
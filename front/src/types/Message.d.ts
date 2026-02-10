import type { Conversation } from "./Conversation"

export interface GetMessageListParams {
    conversation_id: number
    page:            number
    page_size:       number
}

export interface MessageListData {
    messages:  Message[]
    page:      number
    page_size: number
    total:     number
}

export interface Message {
    id:              number
    created_at:      Date
    updated_at:      Date
    content:         string
    reasoning_content: string
    type:            number
    message_role:    number
    user_id:         number
    conversation_id: number
    conversation:    Conversation
}

export interface MessageSSEData {
    content:         string
    reasoning_content: string
    conversation_id: number
    type:            string
    user_message_id: number
}
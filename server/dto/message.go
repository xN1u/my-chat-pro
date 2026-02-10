package dto

import "server/model"

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type SendRequest struct {
	ConversationID uint              `json:"conversation_id"`
	Content        string            `json:"content" binding:"required"`
	Type           model.MessageType `json:"type" binding:"required"`
	ReasonModal    bool            `json:"reason_modal" default:"false"`
}

type GetMessageListQuery struct {
	ConversationID uint `form:"conversation_id" binding:"required"`
	Page           int  `form:"page"`
	PageSize       int  `form:"page_size"`
}

type RequestBody struct {
	Model             string    `json:"model"`
	Messages          []Message `json:"messages"`
	Stream            bool      `json:"stream"`
	EnableThinking    bool      `json:"enable_thinking"`
	EnableSearch      bool      `json:"enable_search"`
	ResultFormat      string    `json:"result_format"`
	IncrementalOutput bool      `json:"incremental_output"`
}

type ChoiceItem struct {
	Message      Message     `json:"message"`
	FinishReason string      `json:"finish_reason"`
	Index        int         `json:"index"`
	Logprobs     interface{} `json:"logprobs"`
}

type UsageItem struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// 完整的 Qwen API 响应结构体
type QwenResponse struct {
	Choices           []ChoiceItem `json:"choices"`
	Object            string       `json:"object"`
	Usage             UsageItem    `json:"usage"`
	Created           int64        `json:"created"`
	Model             string       `json:"model"`
	SystemFingerprint interface{}  `json:"system_fingerprint"`
	Id                string       `json:"id"`
}

// 完整的 Qwen API 流式响应结构体
type QwenStreamChunk struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index int `json:"index"`
		Delta struct {
			Role             string `json:"role,omitempty"`
			Content          string `json:"content,omitempty"`
			ReasoningContent string `json:"reasoning_content,omitempty"`
		} `json:"delta"`
		FinishReason *string `json:"finish_reason,omitempty"`
	} `json:"choices"`
}

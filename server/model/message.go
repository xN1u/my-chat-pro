// Message 消息模型
// 定义消息的数据结构和相关常量
package model

import (
	"time"

	"gorm.io/gorm" // GORM数据库框架
)

// MessageRole 消息角色类型
type MessageRole int

// 消息角色常量定义
const (
	MessageRoleAI   MessageRole = 1 // AI消息
	MessageRoleUser MessageRole = 2 // 用户消息
)

// MessageType 消息类型
type MessageType int

// 消息类型常量定义
const (
	MessageTypeText  MessageType = 1 // 文本消息
	MessageTypeImage MessageType = 2 // 图片消息
	MessageTypeAudio MessageType = 3 // 音频消息
	MessageTypeVideo MessageType = 4 // 视频消息
)

// Message 消息模型结构体
type Message struct {
	ID               uint           `gorm:"primary_key" json:"id"`               // 消息ID，主键
	CreatedAt        time.Time      `json:"created_at"`                             // 创建时间
	UpdatedAt        time.Time      `json:"updated_at"`                             // 更新时间
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`                        // 软删除时间，不在JSON中返回
	Content          string         `json:"content" gorm:"type:text;not null"`     // 消息内容，文本类型，非空
	ReasoningContent string         `json:"reasoning_content" gorm:"type:text;not null"` // AI推理内容，文本类型，非空
	Type             MessageType    `gorm:"default:1" json:"type"`                 // 消息类型，默认文本
	MessageRole      MessageRole    `gorm:"default:1" json:"message_role"`         // 消息角色，默认AI消息
	UserID           uint           `json:"user_id"`                                // 用户ID
	ConversationID   uint           `json:"conversation_id" gorm:"index"`          // 对话ID，索引
	Conversation     *Conversation  `json:"conversation"`                          // 关联的对话对象
}

// TableName 指定表名
func (Message) TableName() string {
	return "messages" // 表名为messages
}

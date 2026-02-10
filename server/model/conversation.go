package model

import (
	"time"

	"gorm.io/gorm"
)

type Conversation struct {
	ID        uint           `json:"id" gorm:"primary_key"`
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Title     string         `json:"title"`
	UserID    uint           `json:"user_id" gorm:"index"`
	LastMsg   string         `json:"last_msg"`
	LastMsgAt *time.Time     `json:"last_msg_at" gorm:"default:null"`
	Messages  []Message      `json:"messages" gorm:"foreignKey:ConversationID"`
}

func (Conversation) TableName() string {
	return "conversations"
}

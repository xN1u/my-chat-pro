package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"server/dto"
	"server/model"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

const (
	// 会话上下文缓存Key：conversation_ctx:{conversationID}
	conversationCtxKeyPrefix = "conversation_ctx:%d"
	conversationCtxExpire    = 7 * 24 * time.Hour
)

type ConversationCache struct {
	RDB *redis.Client
	DB  *gorm.DB // 降级时用到DB
}

type Message = dto.Message

func (cc *ConversationCache) GetConversationCtxFromRedis(convID uint) ([]Message, error) {
	ctx := context.Background()
	// 构建Redis Key：conversation_ctx:{convID}
	key := fmt.Sprintf(conversationCtxKeyPrefix, convID)

	// 从Redis获取序列化的上下文
	jsonStr, err := cc.RDB.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return []Message{}, fmt.Errorf("缓存未命中")
		}
		return nil, err
	}

	// 反序列化为消息列表
	var conversationCtx []Message
	if err := json.Unmarshal([]byte(jsonStr), &conversationCtx); err != nil {
		return nil, err
	}

	return conversationCtx, nil
}

func (cc *ConversationCache) SetConversationCtxToRedis(convID uint, ctx []Message) error {
	ctxRedis := context.Background()
	key := fmt.Sprintf(conversationCtxKeyPrefix, convID)

	// 序列化上下文
	jsonStr, err := json.Marshal(ctx)
	if err != nil {
		return err
	}

	// 写入Redis并设置过期时间
	return cc.RDB.Set(ctxRedis, key, jsonStr, conversationCtxExpire).Err()
}

func (cc *ConversationCache) BuildConversationCtxFromDB(convID uint, uid uint) []Message {
	// 初始化system消息
	conversationCtx := []Message{
		{Role: "system", Content: "You are a helpful assistant."},
	}

	// 从数据库查询该会话的历史消息（按创建时间升序）
	var messages []model.Message
	if err := cc.DB.Where("conversation_id = ? AND user_id = ?", convID, uid).
		Order("created_at ASC").Find(&messages).Error; err != nil {
		log.Printf("从数据库构建上下文失败：convID=%d, err=%v", convID, err)
		return conversationCtx
	}

	// 转换为AI需要的Message格式
	for _, msg := range messages {
		var role string
		switch msg.MessageRole {
		case model.MessageRoleUser:
			role = "user"
		case model.MessageRoleAI:
			role = "assistant"
		default:
			log.Printf("检测到未知的消息角色类型，跳过该消息 | msgID=%d, roleValue=%d, content=%s",
				msg.ID, msg.MessageRole, msg.Content)
			continue
		}
		conversationCtx = append(conversationCtx, Message{
			Role:    role,
			Content: msg.Content,
		})
	}
	return conversationCtx
}

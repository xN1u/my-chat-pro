// MessageController 消息控制器
// 负责处理消息相关的HTTP请求，包括发送消息、获取消息列表、删除消息等
package controller

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"server/cache"     // 缓存包，用于对话上下文缓存
	"server/config"    // 配置包，包含数据库连接等配置
	"server/dto"       // 数据传输对象，定义请求和响应结构
	"server/model"     // 模型包，包含数据模型定义
	"server/services"  // 服务包，包含AI服务等业务逻辑
	"server/utils"     // 工具包，包含SSE等工具函数
	"strings"
	"time"

	"github.com/gin-gonic/gin"     // Gin框架
	"github.com/redis/go-redis/v9"  // Redis客户端
	"gorm.io/gorm"                 // GORM数据库框架
)

// MessageController 消息控制器结构体
type MessageController struct {
	DB  *gorm.DB        // 数据库连接
	RDB *redis.Client   // Redis连接
}

/**
 * SendMessage 发送消息
 * 1. 解析请求参数
 * 2. 获取当前用户ID
 * 3. 处理对话逻辑（创建或获取现有对话）
 * 4. 保存用户消息
 * 5. 调用AI服务获取回复
 * 6. 保存AI消息
 * 7. 更新对话信息
 * 8. 返回响应
 */
func (mc *MessageController) SendMessage(c *gin.Context) {
	// 解析请求参数
	var req dto.SendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请求参数错误",
			"data": nil,
		})
		return
	}

	// 获取当前用户ID
	currentUserID, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "用户未登录",
			"data": nil,
		})
		return
	}
	uid, ok := currentUserID.(uint)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "用户未登录",
			"data": nil,
		})
	}

	conversation := model.Conversation{}
	if req.ConversationID > 0 {
		if err := mc.DB.Where("id = ? AND user_id = ?", req.ConversationID, uid).First(&conversation).Error; err != nil {
			log.Printf("获取对话列表失败：user_id=%d, err=%v", uid, err)
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "会话不存在或用户无权访问",
				"data": nil,
			})
			return
		}
	} else {
		title := ""
		if len(req.Content) > 10 {
			title = req.Content[:10] + "..."
		} else {
			title = req.Content
		}
		conversation = model.Conversation{
			Title:     title,
			UserID:    uid,
			LastMsg:   "",
			LastMsgAt: nil,
		}

		if err := mc.DB.Create(&conversation).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "创建会话失败",
				"data": nil,
			})
			return
		}
	}

	userMessage := model.Message{
		Content:        req.Content,
		Type:           req.Type,
		MessageRole:    model.MessageRoleUser,
		UserID:         uid,
		ConversationID: conversation.ID,
	}

	if err := mc.DB.Create(&userMessage).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "发送消息失败",
			"data": nil,
		})
		return
	}

	aiResponseContent, err := services.GetAIResponse(req.Content)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "获取 AI 回复失败",
			"data": nil,
		})
		return
	}

	aiMessage := model.Message{
		Content:        aiResponseContent,
		Type:           model.MessageTypeText,
		MessageRole:    model.MessageRoleAI,
		UserID:         uid,
		ConversationID: conversation.ID,
	}

	if err := mc.DB.Create(&aiMessage).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "发送 AI 回复失败",
			"data": nil,
		})
		return
	}

	now := time.Now()
	conversation.LastMsg = req.Content
	conversation.LastMsgAt = &now
	if err := mc.DB.Save(&conversation).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "更新会话失败",
			"data": nil,
		})
		return
	}

	userMessage.Conversation = &conversation
	aiMessage.Conversation = &conversation

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "发送消息成功",
		"data": gin.H{
			"conversation_id": conversation.ID,
			"user_message":    userMessage,
			"ai_message":      aiMessage,
		},
	})

}

// SendMessageStream 发送消息流式响应
func (mc *MessageController) SendMessageStream(c *gin.Context) {
	cache := cache.ConversationCache{DB: config.DB, RDB: config.RDB}
	var req dto.SendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.PushSSEError(c, "请求参数错误")
		return
	}

	currentUserID, ok := c.Get("userID")
	if !ok {
		utils.PushSSEError(c, "用户未登录")
		return
	}
	uid, ok := currentUserID.(uint)
	if !ok {
		utils.PushSSEError(c, "用户未登录")
		return
	}

	conversation := model.Conversation{}
	if req.ConversationID > 0 {
		if err := mc.DB.Where("id = ? AND user_id = ?", req.ConversationID, uid).First(&conversation).Error; err != nil {
			log.Printf("获取对话列表失败：user_id=%d, err=%v", uid, err)
			utils.PushSSEError(c, "会话不存在或用户无权访问")
			return
		}
	} else {
		title := ""
		if len(req.Content) > 10 {
			title = req.Content[:10] + "..."
		} else {
			title = req.Content
		}
		conversation = model.Conversation{
			Title:     title,
			UserID:    uid,
			LastMsg:   "",
			LastMsgAt: nil,
		}

		if err := mc.DB.Create(&conversation).Error; err != nil {
			utils.PushSSEError(c, "创建会话失败")
			return
		}

		initialCtx := []dto.Message{
			{Role: "system", Content: "You are a helpful assistant."},
		}

		if err := cache.SetConversationCtxToRedis(conversation.ID, initialCtx); err != nil {
			log.Printf("初始化会话Redis上下文失败：convID=%d, err=%v", conversation.ID, err)
			// 降级：不中断流程，后续从数据库补全
		}
	}

	conversationCtx, err := cache.GetConversationCtxFromRedis(conversation.ID)
	if err != nil {
		log.Printf("读取Redis上下文失败，降级从数据库查询：convID=%d, err=%v", conversation.ID, err)
		// 降级逻辑：从数据库读取历史消息构建上下文（可选，增强健壮性）
		conversationCtx = cache.BuildConversationCtxFromDB(conversation.ID, uid)
	}

	userMessage := model.Message{
		Content:        req.Content,
		Type:           req.Type,
		MessageRole:    model.MessageRoleUser,
		UserID:         uid,
		ConversationID: conversation.ID,
	}
	if err := mc.DB.Create(&userMessage).Error; err != nil {
		utils.PushSSEError(c, "发送消息失败")
		return
	}

	conversationCtx = append(conversationCtx, dto.Message{
		Role:    "user",
		Content: req.Content,
	})

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Status(http.StatusOK)

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		utils.PushSSEError(c, "当前环境不支持流式输出")
		return
	}

	aiModel := os.Getenv("AI_MODEL")
	aiApiKey := os.Getenv("AI_API_KEY")
	aiApiUrl := os.Getenv("AI_API_URL")
	if aiModel == "" || aiApiKey == "" || aiApiUrl == "" {
		utils.PushSSEError(c, "AI环境变量未配置完整")
		return
	}

	requestBody := dto.RequestBody{
		Model:             aiModel,
		Stream:            true,
		EnableThinking:    req.ReasonModal,
		EnableSearch:      true,
		ResultFormat:      "message",
		IncrementalOutput: true,
		Messages:          conversationCtx,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		log.Printf("序列化请求体失败：%v", err)
		utils.PushSSEError(c, "构建AI请求失败")
		return
	}

	log.Printf("AI请求体（JSON）：%s", string(jsonData))

	reqAI, err := http.NewRequest("POST", aiApiUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("创建AI请求失败：%v", err)
		utils.PushSSEError(c, "构建AI请求失败")
		return
	}

	reqAI.Header.Set("Authorization", "Bearer "+aiApiKey)
	reqAI.Header.Set("Content-Type", "application/json")
	reqAI.Header.Set("Accept", "text/event-stream")

	client := &http.Client{Timeout: 5 * time.Minute}
	respAI, err := client.Do(reqAI)
	if err != nil {
		log.Printf("调用AI接口失败：%v", err)
		utils.PushSSEError(c, "调用AI接口失败")
		return
	}
	defer respAI.Body.Close()

	if respAI.StatusCode != http.StatusOK {
		log.Printf("AI请求失败：%s", respAI.Status)
		utils.PushSSEError(c, fmt.Sprintf("AI接口返回错误：%s", respAI.Status))
		return
	}

	scanner := bufio.NewScanner(respAI.Body)
	reasoningContentBuffer := new(strings.Builder)
	contentBuffer := new(strings.Builder)
	ctx := c.Request.Context()

	for scanner.Scan() {
		select {
		case <-ctx.Done():
			log.Println("前端断开连接，终止流式推送")
			return
		default:
			line := scanner.Text()
			if strings.HasPrefix(line, "data: ") {
				dataStr := line[6:]

				if dataStr == "[DONE]" {
					utils.SendSSEData(c, flusher, map[string]interface{}{
						"type":            "done",
						"msg":             "流式响应结束",
						"conversation_id": conversation.ID,
					})
					break
				}

				var chunk dto.QwenStreamChunk
				if err := json.Unmarshal([]byte(dataStr), &chunk); err != nil {
					log.Printf("解析AI分片失败：%v, 数据：%s", err, dataStr)
					continue
				}

				if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.ReasoningContent != "" {
					reasoningContent := chunk.Choices[0].Delta.ReasoningContent
					reasoningContentBuffer.WriteString(reasoningContent)

					utils.SendSSEData(c, flusher, map[string]interface{}{
						"type":              "reasoning",
						"reasoning_content": reasoningContent,
						"conversation_id":   conversation.ID,
						"user_message_id":   userMessage.ID,
					})
				}

				if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
					deltaContent := chunk.Choices[0].Delta.Content
					contentBuffer.WriteString(deltaContent)

					utils.SendSSEData(c, flusher, map[string]interface{}{
						"type":            "chunk",
						"content":         deltaContent,
						"conversation_id": conversation.ID,
						"user_message_id": userMessage.ID,
					})
				}
			}
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("读取AI流式响应失败：%v", err)
		utils.PushSSEError(c, "读取AI响应失败")
		return
	}

	aiReasoningContent := reasoningContentBuffer.String()
	aiResponseContent := contentBuffer.String()
	if aiResponseContent == "" {
		aiResponseContent = "AI未返回有效内容"
	}

	aiMessage := model.Message{
		Content:          aiResponseContent,
		ReasoningContent: aiReasoningContent,
		Type:             model.MessageTypeText,
		MessageRole:      model.MessageRoleAI,
		UserID:           uid,
		ConversationID:   conversation.ID,
	}
	if err := mc.DB.Create(&aiMessage).Error; err != nil {
		log.Printf("保存AI消息失败：%v", err)
		utils.SendSSEData(c, flusher, map[string]interface{}{
			"type": "error",
			"msg":  "保存AI回复失败",
		})
		return
	}

	conversationCtx = append(conversationCtx, dto.Message{
		Role:    "assistant", //
		Content: aiResponseContent,
	})
	if err := cache.SetConversationCtxToRedis(conversation.ID, conversationCtx); err != nil {
		log.Printf("更新Redis上下文失败：convID=%d, err=%v", conversation.ID, err)
	}

	now := time.Now()
	conversation.LastMsgAt = &now

	var title string
	if aiReasoningContent != "" {
		title = utils.SafeTruncateStr(aiReasoningContent, 10)
	} else {
		title = utils.SafeTruncateStr(req.Content, 10)
	}
	if title == "" {
		title = "无标题会话"
	}
	conversation.Title = title

	conversation.LastMsg = utils.SafeTruncateStr(aiResponseContent, 10)
	if conversation.LastMsg == "" {
		conversation.LastMsg = "无消息内容"
	}
	if err := mc.DB.Save(&conversation).Error; err != nil {
		log.Printf("更新会话失败：%v", err)
		utils.SendSSEData(c, flusher, map[string]interface{}{
			"type": "error",
			"msg":  "更新会话失败",
		})
		return
	}

	utils.SendSSEData(c, flusher, map[string]interface{}{
		"type":            "complete",
		"msg":             "操作成功",
		"conversation_id": conversation.ID,
		"user_message":    userMessage,
		"ai_message":      aiMessage,
	})
}

func (mc *MessageController) GetMessageList(c *gin.Context) {
	var query dto.GetMessageListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请求参数错误",
			"data": nil,
		})
		return
	}

	page := query.Page
	pageSize := query.PageSize
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	currentUserID, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "用户未登录",
			"data": nil,
		})
		return
	}
	uid, ok := currentUserID.(uint)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "用户未登录",
			"data": nil,
		})
		return
	}
	var conversation model.Conversation
	if err := mc.DB.Where("id = ? AND user_id = ?", query.ConversationID, uid).First(&conversation).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "会话不存在或用户无权访问",
			"data": nil,
		})
		return
	}

	var messages []model.Message

	if err := mc.DB.Where("user_id = ? AND conversation_id = ?", uid, query.ConversationID).
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).Find(&messages).
		Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "获取消息失败",
			"data": nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取消息成功",
		"data": gin.H{
			"page":      page,
			"page_size": pageSize,
			"total":     len(messages),
			"messages":  messages,
		},
	})
}

func (mc *MessageController) DeleteMessage(c *gin.Context) {
	var messageID uint
	if _, err := fmt.Sscanf(c.Param("message_id"), "%d", &messageID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请求参数错误",
			"data": nil,
		})
		return
	}

	currentUserID, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "用户未登录",
			"data": nil,
		})
		return
	}
	uid, ok := currentUserID.(uint)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "用户未登录",
			"data": nil,
		})
		return
	}
	var message model.Message
	if err := mc.DB.Where("id = ? AND user_id = ?", messageID, uid).First(&message).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "消息不存在或用户无权访问",
			"data": nil,
		})
		return
	}

	if err := mc.DB.Delete(&message).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "删除消息失败",
			"data": nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除消息成功",
		"data": nil,
	})

}

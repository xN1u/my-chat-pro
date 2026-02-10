package controller

import (
	"fmt"
	"log"
	"net/http"
	"server/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ConversationController struct {
	DB *gorm.DB
}

type CreateRequest struct {
	Title string `json:"title"`
}

type GetConversationListQuery struct {
	Page     int `form:"page"`
	PageSize int `form:"page_size"`
}

func (cc *ConversationController) CreateConversation(c *gin.Context) {
	var req CreateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请求参数错误",
			"data": nil,
		})
		return
	}

	currentUserID, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"code": 403,
			"msg":  "未获取到用户身份信息，无权限创建对话",
			"data": nil,
		})
		return
	}

	uid, ok := currentUserID.(uint)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"code": 403,
			"msg":  "你没有权限创建该用户的对话",
			"data": nil,
		})
		return
	}

	lastConversation := model.Conversation{}
	err := cc.DB.Where("user_id = ?", uid).Preload("Messages").Last(&lastConversation).Error
	if err != nil {
		if err != gorm.ErrRecordNotFound {
			log.Printf("获取最近一次对话失败：user_id=%d, err=%v", uid, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "获取最近一次对话失败",
				"data": nil,
			})
			return
		}
	} else {
		if len(lastConversation.Messages) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"code": 200,
				"msg":  "复用最近空对话成功",
				"data": lastConversation,
			})
			return
		}
	}

	conversation := model.Conversation{
		UserID:    uid,
		Title:     req.Title,
		LastMsg:   "",
		LastMsgAt: nil,
	}

	if conversation.Title == "" {
		conversation.Title = "新对话"
	}

	if err := cc.DB.Create(&conversation).Error; err != nil {
		log.Printf("创建对话失败：user_id=%d, title=%s, err=%v", uid, conversation.Title, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建对话失败",
			"data": nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建对话成功",
		"data": conversation,
	})
}

func (cc *ConversationController) GetConversations(c *gin.Context) {
	var query GetConversationListQuery
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
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 50 {
		pageSize = 50
	}

	currentUserID, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"code": 403,
			"msg":  "未获取到用户身份信息，无权限查看对话",
			"data": nil,
		})
		return
	}
	uid, ok := currentUserID.(uint)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"code": 403,
			"msg":  "你没有权限查看该用户的对话",
			"data": nil,
		})
		return
	}

	var conversations []model.Conversation
	offset := (page - 1) * pageSize
	if err := cc.DB.Where("user_id = ?", uid).
		Order("last_msg_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&conversations).Error; err != nil {
		log.Printf("获取对话列表失败：user_id=%d, err=%v", uid, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "获取对话列表失败",
			"data": nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取对话列表成功",
		"data": gin.H{
			"conversations": conversations,
			"page":         page,
			"page_size":    pageSize,
			"total":        len(conversations),
		},
	})
}

func (cc *ConversationController) DeleteConversation(c *gin.Context) {
	var conversationID uint
	if _, err := fmt.Sscanf(c.Param("conversation_id"), "%d", &conversationID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请求参数错误",
			"data": nil,
		})
		return
	}

	currentUserID, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"code": 403,
			"msg":  "未获取到用户身份信息，无权限删除对话",
			"data": nil,
		})
		return
	}
	uid, ok := currentUserID.(uint)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"code": 403,
			"msg":  "你没有权限删除该用户的对话",
			"data": nil,
		})
		return
	}

	var conversation model.Conversation
	if err := cc.DB.Where("id = ? AND user_id = ?", conversationID, uid).First(&conversation).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "对话不存在",
			"data": nil,
		})
		return
	}

	if err := cc.DB.Delete(&conversation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除对话失败",
			"data": nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除对话成功",
		"data": nil,
	})

}

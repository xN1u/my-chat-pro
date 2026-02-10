package router

import (
	"os"
	"server/config"
	"server/controller"
	"server/middleware"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("FRONT_URL")}, // 前端地址
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "cache-control"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	authCtrl := controller.AuthController{DB: config.DB}
	conversationCtrl := controller.ConversationController{DB: config.DB}
	messageCtrl := controller.MessageController{DB: config.DB, RDB: config.RDB}

	apiGroup := r.Group("/api")
	{
		auth := apiGroup.Group("/auth")
		{
			auth.POST("/register", authCtrl.Register)
			auth.POST("/login", authCtrl.Login)
		}

		conversation := apiGroup.Group("/conversation")
		{
			conversation.POST("/create", middleware.JWTAuth(), conversationCtrl.CreateConversation)
			conversation.GET("/list", middleware.JWTAuth(), conversationCtrl.GetConversations)
			conversation.DELETE("/delete/:conversation_id", middleware.JWTAuth(), conversationCtrl.DeleteConversation)
		}

		message := apiGroup.Group("/message")
		{
			message.POST("/send", middleware.JWTAuth(), messageCtrl.SendMessage)
			message.GET("/list", middleware.JWTAuth(), messageCtrl.GetMessageList)
			message.DELETE("/delete/:message_id", middleware.JWTAuth(), messageCtrl.DeleteMessage)
			message.POST("/stream", middleware.JWTAuth(), messageCtrl.SendMessageStream)
		}
	}

	return r
}

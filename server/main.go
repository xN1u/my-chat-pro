// MyChat 后端服务主文件
// 负责初始化环境、数据库连接、表结构迁移和启动HTTP服务
package main

import (
	"log"
	"os"
	"server/config"     // 配置包，包含数据库连接等配置
	"server/model"      // 模型包，包含数据模型定义
	"server/router"     // 路由包，包含HTTP路由定义

	"github.com/joho/godotenv" // 环境变量加载库
)

/**
 * 主函数
 * 1. 加载环境变量
 * 2. 初始化数据库连接
 * 3. 自动迁移表结构
 * 4. 设置路由
 * 5. 启动HTTP服务
 */
func main() {
	// 加载 .env 文件中的环境变量
	err := godotenv.Load()

	if err != nil {
		panic(err) // 环境变量加载失败，程序终止
	}

	// 初始化数据库连接
	config.InitDB()

	// 自动迁移表结构，创建或更新 User、Conversation、Message 表
	err = config.DB.AutoMigrate(&model.User{},&model.Conversation{},&model.Message{})

	if err != nil {
		log.Fatal("表结构迁移失败", err) // 表结构迁移失败，程序终止
	}

	// 设置路由
	r := router.SetupRouter()

	// 打印启动信息
	log.Println("后端服务启动")

	// 启动HTTP服务，监听指定端口
	err = r.Run(":" + os.Getenv("PORT"))

	if err != nil {
		log.Fatal("后端服务启动失败", err) // 服务启动失败，程序终止
	}
}
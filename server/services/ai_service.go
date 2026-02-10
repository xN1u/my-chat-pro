// services 包
// 包含AI服务等业务逻辑
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"server/dto" // 数据传输对象，定义请求和响应结构
)

/**
 * GetAIResponse 获取AI响应
 * 1. 检查环境变量配置
 * 2. 创建HTTP客户端
 * 3. 构建请求体
 * 4. 发送HTTP请求到AI API
 * 5. 处理响应
 * 6. 解析AI回复
 * 7. 返回AI回复内容
 */
func GetAIResponse(content string) (string, error) {
	// 添加短暂延迟，模拟处理时间
	time.Sleep(500 * time.Millisecond)

	// 获取环境变量配置
	aiModel := os.Getenv("AI_MODEL")
	if aiModel == "" {
		return "", fmt.Errorf("AI_MODEL 环境变量未设置")
	}
	aiApiKey := os.Getenv("AI_API_KEY")
	if aiApiKey == "" {
		return "", fmt.Errorf("AI_API_KEY 环境变量未设置")
	}
	aiApiUrl := os.Getenv("AI_API_URL")
	if aiApiUrl == "" {
		return "", fmt.Errorf("AI_API_URL 环境变量未设置")
	}
	
	// 创建 HTTP 客户端
	client := &http.Client{}
	
	// 构建请求体
	requestBody := dto.RequestBody{
		Model: aiModel,
		Messages: []dto.Message{
			{
				Role:    "system",
				Content: "You are a helpful assistant.", // 系统提示，定义AI角色
			},
			{
				Role:    "user",
				Content: content, // 用户输入内容
			},
		},
	}
	
	// 序列化请求体为JSON
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		log.Printf("JSON序列化失败：%v", err)
		return "", err
	}
	
	// 创建 POST 请求
	req, err := http.NewRequest("POST", aiApiUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("创建HTTP请求失败：%v", err)
		return "", err
	}
	
	// 设置请求头
	// 若没有配置环境变量，请用阿里云百炼API Key将下行替换为：apiKey := "sk-xxx"
	// 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/model-studio/get-api-key
	req.Header.Set("Authorization", "Bearer "+aiApiKey) // 认证头
	req.Header.Set("Content-Type", "application/json") // 内容类型
	
	// 发送请求
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("发送HTTP请求失败：%v", err)
		return "", err
	}
	defer resp.Body.Close() // 延迟关闭响应体

	// 检查响应状态码
	if resp.StatusCode != http.StatusOK {
		log.Printf("请求失败：%s", resp.Status)
		return "", fmt.Errorf("请求失败：%s", resp.Status)
	}

	// 读取响应体
	bodyText, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("读取响应体失败：%v", err)
		return "", err
	}
	
	// 打印响应内容（调试用）
	fmt.Printf("%s\n", bodyText)

	// 解析响应内容
	var qwenResp dto.QwenResponse
	if err := json.Unmarshal(bodyText, &qwenResp); err != nil {
		log.Printf("解析响应体失败：%v", err)
		return "", err
	}

	// 提取AI回复内容
	aiReply := qwenResp.Choices[0].Message.Content
	return aiReply, nil
}

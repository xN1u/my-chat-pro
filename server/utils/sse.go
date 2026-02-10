package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func PushSSEError(c *gin.Context, msg string) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	flusher, _ := c.Writer.(http.Flusher)

	SendSSEData(c, flusher, map[string]interface{}{
		"type": "error",
		"msg":  msg,
	})

	SendSSEData(c, flusher, map[string]interface{}{
		"type": "done",
		"msg":  "错误终止",
	})
}

func SendSSEData(c *gin.Context, flusher http.Flusher, data interface{}) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("序列化SSE数据失败：%v", err)
		return
	}

	_, err = fmt.Fprintf(c.Writer, "data: %s\n\n", jsonData)
	if err != nil {
		log.Printf("写入SSE数据失败：%v", err)
		return
	}

	flusher.Flush()
}

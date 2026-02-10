package utils

func SafeTruncateStr(s string, maxLen int) string {
	// 转换为rune切片（按字符数处理）
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	// 截取maxLen个字符，拼接省略号
	return string(runes[:maxLen]) + "..."
}

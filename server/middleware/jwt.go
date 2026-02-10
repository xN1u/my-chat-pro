package middleware

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

type CustomClaims struct {
	UserID   uint
	Username string
	jwt.RegisteredClaims
}

var jwtSecret = []byte(getJWTSecret())

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "my_chat_secret_key"
	}
	return secret
}

func getJWTExpireHours() int {
	expireHours := os.Getenv("JWT_EXPIRES_IN")
	if expireHours == "" {
		return 24
	}

	if hours, err := strconv.Atoi(expireHours); err == nil {
		return hours
	}

	return 24
}

func GenerateToken(userID uint, username string) (string, error) {
	expireHours := getJWTExpireHours()

	claims := CustomClaims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "my-chat",
			Subject:   username,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func ParseToken(tokenString string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		var ve *jwt.ValidationError
		if errors.As(err, &ve) {
			switch {
			case ve.Errors&jwt.ValidationErrorExpired != 0:
				return nil, errors.New("token已过期")
			case ve.Errors&jwt.ValidationErrorSignatureInvalid != 0:
				return nil, errors.New("token签名错误")
			default:
				return nil, fmt.Errorf("token解析失败：%w", err)
			}
		}
		return nil, fmt.Errorf("token格式错误：%w", err)
	}

	// 验证令牌
	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token无效")
}

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code": 401,
				"msg":  "未携带token",
				"data": nil,
			})
			c.Abort()
			return
		}

		var tokenString string
		parts := strings.SplitN(authHeader, " ", 2)
		if parts[0] == "Bearer" && len(parts) == 2 {
			tokenString = parts[1]
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code": 401,
				"msg":  "token格式错误",
				"data": nil,
			})
			c.Abort()
			return
		}

		claims, err := ParseToken(tokenString)
		if err != nil {
			if errors.Is(err, jwt.ErrTokenExpired) {
				c.JSON(http.StatusUnauthorized, gin.H{
					"code": 401,
					"msg":  "Token 已过期，请重新登录",
					"data": nil,
				})
			} else {
				c.JSON(http.StatusUnauthorized, gin.H{
					"code": 401,
					"msg":  "Token 验证失败：" + err.Error(),
					"data": nil,
				})
			}
			c.Abort()
			return
		}

		// Token 验证通过，将 Claim 中的用户信息存入 Gin 上下文（供后续接口使用）
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)

		c.Next()

	}
}

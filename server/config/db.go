package config

import (
	"context"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB
var RDB *redis.Client

func InitDB() {
	dsn := os.Getenv("DATABASE_URL")

	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold: time.Second, // 慢查询阈值
			LogLevel:      logger.Info, // 日志级别
			Colorful:      true,        // 彩色输出
		},
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: newLogger,
	})

	if err != nil {
		panic("数据库连接失败" + err.Error())
	}

	DB = db
	log.Println("数据库连接成功")

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	redisPassword := os.Getenv("REDIS_PASSWORD")
	redisDB := 0
	if dbStr := os.Getenv("REDIS_DB"); dbStr != "" {
		if db, err := strconv.Atoi(dbStr); err == nil {
			redisDB = db
		}
	}
	redisPoolSize := 20
	if poolSizeStr := os.Getenv("REDIS_POOL_SIZE"); poolSizeStr != "" {
		if poolSize, err := strconv.Atoi(poolSizeStr); err == nil {
			redisPoolSize = poolSize
		}
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     redisAddr,     // Redis地址
		Password: redisPassword, // Redis密码
		DB:       redisDB,       // 使用的数据库
		PoolSize: redisPoolSize, // 连接池大小
	})

	ctx := context.Background()
	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Fatalf("Redis连接失败：%v", err)
	}

	RDB = rdb
	log.Println("Redis连接成功")
}

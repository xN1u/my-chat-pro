package model

import "gorm.io/gorm"

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt int64          `json:"created_at"`
	UpdatedAt int64          `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Username  string         `gorm:"uniqueIndex;size:64;not null" json:"username"`
	Password  string         `gorm:"size:128;not null" json:"-"`
	Email     string         `gorm:"uniqueIndex;size:128;not null" json:"email"`
	Nickname  string         `gorm:"size:64" json:"nickname"`
	Avatar    string         `gorm:"size:256" json:"avatar"`
}

func (User) TableName() string {
	return "users"
}

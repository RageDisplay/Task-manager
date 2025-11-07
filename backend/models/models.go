package models

import (
	"database/sql"
	"time"
)

type User struct {
	ID           int            `json:"id"`
	Username     string         `json:"username"`
	PasswordHash string         `json:"-"`
	Role         string         `json:"role"`
	Department   sql.NullString `json:"department"` // Изменено на sql.NullString
	CreatedAt    time.Time      `json:"created_at"`
}

type Task struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Progress     int       `json:"progress"`
	HoursPerWeek float64   `json:"hours_per_week"`
	LoadPerMonth int       `json:"load_per_month"`
	UserID       int       `json:"user_id"`
	Username     string    `json:"username,omitempty"`
	Department   string    `json:"department,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

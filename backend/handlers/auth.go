package handlers

import (
	"database/sql"
	"net/http"
	"task-management-backend/database"
	"task-management-backend/models"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	db *sql.DB
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Username   string `json:"username" binding:"required"`
		Password   string `json:"password" binding:"required"`
		Department string `json:"department" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверка существования пользователя
	var exists bool
	err := h.db.QueryRow("SELECT 1 FROM users WHERE username = ?", req.Username).Scan(&exists)
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Такой пользователь уже существует"})
		return
	}

	// Хеширование пароля
	hashedPassword, err := database.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка формата пароля"})
		return
	}

	// Создание пользователя
	result, err := h.db.Exec(
		"INSERT INTO users (username, password_hash, role, department) VALUES (?, ?, ?, ?)",
		req.Username, hashedPassword, "user", req.Department,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	userID, _ := result.LastInsertId()

	// Генерация JWT токена
	token, err := database.GenerateJWT(int(userID), req.Username, "user", req.Department)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка в генерации токена"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Аккаунт успешно создан",
		"token":   token,
		"user": gin.H{
			"id":         userID,
			"username":   req.Username,
			"role":       "user",
			"department": req.Department,
		},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	var department sql.NullString
	err := h.db.QueryRow(
		"SELECT id, username, password_hash, role, department, created_at FROM users WHERE username = ?",
		req.Username,
	).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &department, &user.CreatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неправильные логин или пароль"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Проверка пароля
	if !database.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неправильные логин или пароль"})
		return
	}

	// Преобразуем sql.NullString в обычный string для JWT
	departmentStr := ""
	if department.Valid {
		departmentStr = department.String
	}

	// Генерация JWT токена
	token, err := database.GenerateJWT(user.ID, user.Username, user.Role, departmentStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка в генерации токена"})
		return
	}

	// Возвращаем ответ
	responseUser := gin.H{
		"id":         user.ID,
		"username":   user.Username,
		"role":       user.Role,
		"department": departmentStr,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Авторизация успешна",
		"token":   token,
		"user":    responseUser,
	})
}

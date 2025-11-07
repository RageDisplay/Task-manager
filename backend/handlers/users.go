package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	db *sql.DB
}

func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{db: db}
}

type UserResponse struct {
	ID         int    `json:"id"`
	Username   string `json:"username"`
	Role       string `json:"role"`
	Department string `json:"department"`
	CreatedAt  string `json:"created_at"`
}

func (h *UserHandler) GetUsers(c *gin.Context) {
	userRole := c.GetString("userRole")
	userDepartment := c.GetString("userDepartment")

	var rows *sql.Rows
	var err error

	if userRole == "admin" {
		rows, err = h.db.Query("SELECT id, username, role, department, created_at FROM users")
	} else {
		rows, err = h.db.Query(
			"SELECT id, username, role, department, created_at FROM users WHERE department = ?",
			userDepartment,
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	users := []UserResponse{}
	for rows.Next() {
		var id int
		var username, role string
		var department sql.NullString
		var createdAt string

		err := rows.Scan(&id, &username, &role, &department, &createdAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Преобразуем sql.NullString в string
		departmentStr := ""
		if department.Valid {
			departmentStr = department.String
		}

		users = append(users, UserResponse{
			ID:         id,
			Username:   username,
			Role:       role,
			Department: departmentStr,
			CreatedAt:  createdAt,
		})
	}

	c.JSON(http.StatusOK, users)
}

func (h *UserHandler) UpdateUserRole(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var request struct {
		Role string `json:"role" binding:"required,oneof=user manager admin"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = h.db.Exec("UPDATE users SET role = ? WHERE id = ?", request.Role, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User role updated successfully"})
}

func (h *UserHandler) UpdateUserDepartment(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var request struct {
		Department string `json:"department" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = h.db.Exec("UPDATE users SET department = ? WHERE id = ?", request.Department, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User department updated successfully"})
}

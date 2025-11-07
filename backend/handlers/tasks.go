package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"task-management-backend/models"

	"github.com/gin-gonic/gin"
)

type TaskHandler struct {
	db *sql.DB
}

func NewTaskHandler(db *sql.DB) *TaskHandler {
	return &TaskHandler{db: db}
}

func (h *TaskHandler) GetTasks(c *gin.Context) {
	userID := c.GetInt("userID")
	userRole := c.GetString("userRole")
	userDepartment := c.GetString("userDepartment")

	var rows *sql.Rows
	var err error

	switch userRole {
	case "admin":
		rows, err = h.db.Query(`
            SELECT t.*, u.username, u.department 
            FROM tasks t 
            JOIN users u ON t.user_id = u.id 
            ORDER BY t.created_at DESC
        `)
	case "manager":
		rows, err = h.db.Query(`
            SELECT t.*, u.username, u.department 
            FROM tasks t 
            JOIN users u ON t.user_id = u.id 
            WHERE u.department = ? 
            ORDER BY t.created_at DESC
        `, userDepartment)
	default:
		rows, err = h.db.Query(`
            SELECT t.*, u.username, u.department 
            FROM tasks t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.user_id = ? 
            ORDER BY t.created_at DESC
        `, userID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		var task models.Task
		var department sql.NullString

		err := rows.Scan(
			&task.ID, &task.Title, &task.Description, &task.Progress,
			&task.HoursPerWeek, &task.LoadPerMonth, &task.UserID,
			&task.CreatedAt, &task.UpdatedAt, &task.Username, &department,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if department.Valid {
			task.Department = department.String
		}

		tasks = append(tasks, task)
	}

	c.JSON(http.StatusOK, tasks)
}

func (h *TaskHandler) CreateTask(c *gin.Context) {
	userID := c.GetInt("userID")

	var task models.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.db.Exec(`
        INSERT INTO tasks (title, description, progress, hours_per_week, load_per_month, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `, task.Title, task.Description, task.Progress, task.HoursPerWeek, task.LoadPerMonth, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	task.ID = int(id)
	c.JSON(http.StatusCreated, task)
}

func (h *TaskHandler) UpdateTask(c *gin.Context) {
	taskID, _ := strconv.Atoi(c.Param("id"))
	userID := c.GetInt("userID")
	userRole := c.GetString("userRole")

	// Проверка прав доступа
	if userRole == "user" {
		var taskUserID int
		err := h.db.QueryRow("SELECT user_id FROM tasks WHERE id = ?", taskID).Scan(&taskUserID)
		if err != nil || taskUserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
	}

	var task models.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.db.Exec(`
        UPDATE tasks 
        SET title = ?, description = ?, progress = ?, hours_per_week = ?, load_per_month = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, task.Title, task.Description, task.Progress, task.HoursPerWeek, task.LoadPerMonth, taskID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task updated successfully"})
}

func (h *TaskHandler) DeleteTask(c *gin.Context) {
	taskID, _ := strconv.Atoi(c.Param("id"))
	userID := c.GetInt("userID")
	userRole := c.GetString("userRole")

	// Проверка прав доступа
	if userRole == "user" {
		var taskUserID int
		err := h.db.QueryRow("SELECT user_id FROM tasks WHERE id = ?", taskID).Scan(&taskUserID)
		if err != nil || taskUserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
	}

	_, err := h.db.Exec("DELETE FROM tasks WHERE id = ?", taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

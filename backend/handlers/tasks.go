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
		var tempDepartment sql.NullString

		err := rows.Scan(
			&task.ID, &task.Title, &task.Description, &task.Progress,
			&task.HoursPerWeek, &task.LoadPerMonth, &task.UserID,
			&task.CreatedAt, &task.UpdatedAt, &task.Username, &tempDepartment,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if tempDepartment.Valid {
			task.Department = tempDepartment.String
		} else {
			task.Department = ""
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

	// Валидация данных
	if task.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}
	if task.Progress < 0 || task.Progress > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Progress must be between 0 and 100"})
		return
	}
	if task.LoadPerMonth < 0 || task.LoadPerMonth > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Load per month must be between 0 and 100"})
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

	// Получаем созданную задачу с информацией о пользователе
	var createdTask models.Task
	var username string
	var department sql.NullString
	err = h.db.QueryRow(`
        SELECT t.*, u.username, u.department 
        FROM tasks t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.id = ?
    `, task.ID).Scan(
		&createdTask.ID, &createdTask.Title, &createdTask.Description, &createdTask.Progress,
		&createdTask.HoursPerWeek, &createdTask.LoadPerMonth, &createdTask.UserID,
		&createdTask.CreatedAt, &createdTask.UpdatedAt, &username, &department,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	createdTask.Username = username
	if department.Valid {
		createdTask.Department = department.String
	} else {
		createdTask.Department = ""
	}

	c.JSON(http.StatusCreated, createdTask)
}

func (h *TaskHandler) UpdateTask(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	userID := c.GetInt("userID")
	userRole := c.GetString("userRole")

	// Проверка прав доступа
	if userRole == "user" {
		var taskUserID int
		err := h.db.QueryRow("SELECT user_id FROM tasks WHERE id = ?", taskID).Scan(&taskUserID)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		if taskUserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
	}

	var task models.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Валидация данных
	if task.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}
	if task.Progress < 0 || task.Progress > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Progress must be between 0 and 100"})
		return
	}
	if task.LoadPerMonth < 0 || task.LoadPerMonth > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Load per month must be between 0 and 100"})
		return
	}

	result, err := h.db.Exec(`
        UPDATE tasks 
        SET title = ?, description = ?, progress = ?, hours_per_week = ?, load_per_month = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, task.Title, task.Description, task.Progress, task.HoursPerWeek, task.LoadPerMonth, taskID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Получаем обновленную задачу
	var updatedTask models.Task
	var username string
	var department sql.NullString
	err = h.db.QueryRow(`
        SELECT t.*, u.username, u.department 
        FROM tasks t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.id = ?
    `, taskID).Scan(
		&updatedTask.ID, &updatedTask.Title, &updatedTask.Description, &updatedTask.Progress,
		&updatedTask.HoursPerWeek, &updatedTask.LoadPerMonth, &updatedTask.UserID,
		&updatedTask.CreatedAt, &updatedTask.UpdatedAt, &username, &department,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	updatedTask.Username = username
	if department.Valid {
		updatedTask.Department = department.String
	} else {
		updatedTask.Department = ""
	}

	c.JSON(http.StatusOK, updatedTask)
}

func (h *TaskHandler) DeleteTask(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	userID := c.GetInt("userID")
	userRole := c.GetString("userRole")

	// Проверка прав доступа
	if userRole == "user" {
		var taskUserID int
		err := h.db.QueryRow("SELECT user_id FROM tasks WHERE id = ?", taskID).Scan(&taskUserID)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		if taskUserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
	}

	result, err := h.db.Exec("DELETE FROM tasks WHERE id = ?", taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

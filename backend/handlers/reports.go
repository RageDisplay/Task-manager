package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

type ReportHandler struct {
	db *sql.DB
}

func NewReportHandler(db *sql.DB) *ReportHandler {
	return &ReportHandler{db: db}
}

func (h *ReportHandler) ExportMyTasks(c *gin.Context) {
	userID := c.GetInt("userID")

	rows, err := h.db.Query(`
        SELECT title, description, progress, hours_per_week, load_per_month, created_at
        FROM tasks WHERE user_id = ?
    `, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	f := excelize.NewFile()
	f.SetSheetName("Sheet1", "My Tasks")

	// Заголовки
	headers := []string{"Title", "Description", "Progress (%)", "Hours per Week", "Load per Month (%)", "Created At"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue("My Tasks", cell, header)
	}

	// Данные
	rowIndex := 2
	for rows.Next() {
		var title, description string
		var progress, loadPerMonth int
		var hoursPerWeek float64
		var createdAt time.Time

		err := rows.Scan(&title, &description, &progress, &hoursPerWeek, &loadPerMonth, &createdAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		data := []interface{}{title, description, progress, hoursPerWeek, loadPerMonth, createdAt.Format("2006-01-02")}
		for i, value := range data {
			cell, _ := excelize.CoordinatesToCellName(i+1, rowIndex)
			f.SetCellValue("My Tasks", cell, value)
		}
		rowIndex++
	}

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=my_tasks.xlsx")
	f.Write(c.Writer)
}

func (h *ReportHandler) ExportDepartmentTasks(c *gin.Context) {
	userDepartment := c.GetString("userDepartment")

	rows, err := h.db.Query(`
        SELECT t.title, t.description, t.progress, t.hours_per_week, t.load_per_month, 
               t.created_at, u.username
        FROM tasks t 
        JOIN users u ON t.user_id = u.id 
        WHERE u.department = ?
    `, userDepartment)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	f := excelize.NewFile()
	f.SetSheetName("Sheet1", "Department Tasks")

	headers := []string{"Title", "Description", "Progress (%)", "Hours per Week", "Load per Month (%)", "Created At", "User"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue("Department Tasks", cell, header)
	}

	rowIndex := 2
	for rows.Next() {
		var title, description, username string
		var progress, loadPerMonth int
		var hoursPerWeek float64
		var createdAt time.Time

		err := rows.Scan(&title, &description, &progress, &hoursPerWeek, &loadPerMonth, &createdAt, &username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		data := []interface{}{title, description, progress, hoursPerWeek, loadPerMonth,
			createdAt.Format("2006-01-02"), username}
		for i, value := range data {
			cell, _ := excelize.CoordinatesToCellName(i+1, rowIndex)
			f.SetCellValue("Department Tasks", cell, value)
		}
		rowIndex++
	}

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=department_tasks.xlsx")
	f.Write(c.Writer)
}

func (h *ReportHandler) ExportAllTasks(c *gin.Context) {
	rows, err := h.db.Query(`
        SELECT t.title, t.description, t.progress, t.hours_per_week, t.load_per_month, 
               t.created_at, u.username, u.department
        FROM tasks t 
        JOIN users u ON t.user_id = u.id
    `)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	f := excelize.NewFile()
	f.SetSheetName("Sheet1", "All Tasks")

	headers := []string{"Title", "Description", "Progress (%)", "Hours per Week", "Load per Month (%)",
		"Created At", "User", "Department"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue("All Tasks", cell, header)
	}

	rowIndex := 2
	for rows.Next() {
		var title, description, username, department string
		var progress, loadPerMonth int
		var hoursPerWeek float64
		var createdAt time.Time

		err := rows.Scan(&title, &description, &progress, &hoursPerWeek, &loadPerMonth,
			&createdAt, &username, &department)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		data := []interface{}{title, description, progress, hoursPerWeek, loadPerMonth,
			createdAt.Format("2006-01-02"), username, department}
		for i, value := range data {
			cell, _ := excelize.CoordinatesToCellName(i+1, rowIndex)
			f.SetCellValue("All Tasks", cell, value)
		}
		rowIndex++
	}

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=all_tasks.xlsx")
	f.Write(c.Writer)
}

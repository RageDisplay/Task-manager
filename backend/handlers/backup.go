package handlers

import (
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func BackupDB(c *gin.Context) {
	backupFileName := "backup_" + time.Now().Format("2006-01-02_15-04-05") + ".db"

	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename="+backupFileName)
	c.Header("Content-Transfer-Encoding", "binary")

	http.ServeFile(c.Writer, c.Request, "./tasks.db")
}

func RestoreDB(c *gin.Context) {
	file, err := c.FormFile("database")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	// Создание резервной копии перед восстановлением
	backupName := "backup_pre_restore_" + time.Now().Format("2006-01-02_15-04-05") + ".db"
	original, _ := os.Open("./tasks.db")
	defer original.Close()

	backup, _ := os.Create(backupName)
	defer backup.Close()

	io.Copy(backup, original)

	// Сохранение новой базы данных
	dst := "./tasks.db"
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Database restored successfully"})
}

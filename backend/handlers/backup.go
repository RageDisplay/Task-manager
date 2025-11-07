package handlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

func BackupDB(c *gin.Context) {
	dbPath := "./data/tasks.db"

	// Проверяем существование файла БД
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database file not found"})
		return
	}

	// Создаем имя файла с timestamp
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	backupFileName := "backup_" + timestamp + ".db"

	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename="+backupFileName)

	// Открываем файл БД
	file, err := os.Open(dbPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open database file"})
		return
	}
	defer file.Close()

	// Копируем файл в response
	_, err = io.Copy(c.Writer, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send database file"})
		return
	}
}

func RestoreDB(c *gin.Context) {
	dbPath := "./data/tasks.db"

	// Получаем файл из запроса
	file, err := c.FormFile("database")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	// Проверяем расширение файла
	if filepath.Ext(file.Filename) != ".db" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only .db files are allowed"})
		return
	}

	// Создаем резервную копию текущей БД
	if _, err := os.Stat(dbPath); err == nil {
		backupName := "backup_before_restore_" + time.Now().Format("2006-01-02_15-04-05") + ".db"
		err := copyFile(dbPath, backupName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create backup"})
			return
		}
	}

	// Сохраняем новую БД
	if err := c.SaveUploadedFile(file, dbPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Database restored successfully"})
}

func copyFile(src, dst string) error {
	source, err := os.Open(src)
	if err != nil {
		return err
	}
	defer source.Close()

	destination, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destination.Close()

	_, err = io.Copy(destination, source)
	return err
}

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
		c.JSON(http.StatusNotFound, gin.H{"error": "Файл базы данных не найден"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка открытия файла базы данных"})
		return
	}
	defer file.Close()

	// Копируем файл в response
	_, err = io.Copy(c.Writer, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка в отправке файла базы данных"})
		return
	}
}

func RestoreDB(c *gin.Context) {
	dbPath := "./data/tasks.db"

	// Получаем файл из запроса
	file, err := c.FormFile("database")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Пустой ввод"})
		return
	}

	// Проверяем расширение файла
	if filepath.Ext(file.Filename) != ".db" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Только .db файлы допустимы"})
		return
	}

	// Создаем резервную копию текущей БД
	if _, err := os.Stat(dbPath); err == nil {
		backupName := "backup_before_restore_" + time.Now().Format("2006-01-02_15-04-05") + ".db"
		err := copyFile(dbPath, backupName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка в создании бекапа"})
			return
		}
	}

	// Сохраняем новую БД
	if err := c.SaveUploadedFile(file, dbPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка в сохранении новой базы данных"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Система успешно восстановлена из бекапа"})
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

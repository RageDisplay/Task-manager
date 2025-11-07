package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

func InitDB() (*sql.DB, error) {
	// Создаем директорию для данных, если её нет
	dataDir := "./data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, err
	}

	dbPath := filepath.Join(dataDir, "tasks.db")
	log.Printf("Initializing database at: %s", dbPath)

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	// Создание таблицы пользователей
	createUsersTable := `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        department VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`

	// Создание таблицы задач
	createTasksTable := `
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        progress INTEGER DEFAULT 0,
        hours_per_week DECIMAL(10,2) DEFAULT 0,
        load_per_month INTEGER DEFAULT 0,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );`

	tables := []string{createUsersTable, createTasksTable}
	for _, table := range tables {
		_, err = db.Exec(table)
		if err != nil {
			return nil, err
		}
	}

	// Создание администратора по умолчанию
	hashedPassword, _ := HashPassword("admin123")
	db.Exec(`INSERT OR IGNORE INTO users (username, password_hash, role, department) 
             VALUES (?, ?, ?, ?)`, "admin", hashedPassword, "admin", "Administration")

	log.Println("Database initialized successfully")
	return db, nil
}

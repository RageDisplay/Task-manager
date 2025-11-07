package database

import (
	"database/sql"
	"log"
)

func CheckDatabase(db *sql.DB) error {
	// Проверяем таблицу users
	var userCount int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if err != nil {
		return err
	}
	log.Printf("Users in database: %d", userCount)

	// Проверяем таблицу tasks
	var taskCount int
	err = db.QueryRow("SELECT COUNT(*) FROM tasks").Scan(&taskCount)
	if err != nil {
		return err
	}
	log.Printf("Tasks in database: %d", taskCount)

	// Выводим список пользователей
	rows, err := db.Query("SELECT id, username, role, department FROM users")
	if err != nil {
		return err
	}
	defer rows.Close()

	log.Println("User list:")
	for rows.Next() {
		var id int
		var username, role, department string
		err := rows.Scan(&id, &username, &role, &department)
		if err != nil {
			return err
		}
		log.Printf("  ID: %d, Username: %s, Role: %s, Department: %s", id, username, role, department)
	}

	return nil
}

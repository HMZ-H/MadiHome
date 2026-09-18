package database

import (
	"fmt"
	"log"
	"os"

	"github.com/HMZ-H/Madihome/Domain/entity"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDatabase() (*gorm.DB, error) {
	// Load database configuration from environment variables
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
		if err != nil {
			return nil, err
		}
		// Auto-migrate the schema
		migrate(db)
		return db, nil
	}
	// Fallback to individual environment variables if DATABASE_URL is not set
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	sslmode := os.Getenv("DB_SSLMODE")

	if sslmode == "" {
		if os.Getenv("ENV") == "production" {
			sslmode = "require"
		} else {
			sslmode = "disable"
		}
	}
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		host, user, password, dbname, port, sslmode,
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	// Auto-migrate the schema
	migrate(db)
	return db, nil
}

// migrate applies schema migrations
func migrate(db *gorm.DB) {
	if err := db.AutoMigrate(
		&entity.User{},
		&entity.RefreshToken{},
		&entity.Doctor{},
		&entity.HomecareService{},
		&entity.HomecareVisit{},
		&entity.HomecarePlan{},
		&entity.Booking{},
		&entity.Message{},
		&entity.RoleRequest{},
		&entity.Notification{},
	); err != nil {
		log.Fatalf("Failed to migrate database schema: %v", err)
	} else {
		log.Println("Database schema migrated successfully")
	}
}

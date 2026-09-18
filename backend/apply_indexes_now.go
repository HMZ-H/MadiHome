// package main

// import (
// 	"log"
// 	"os"

// 	"github.com/HMZ-H/Madihome/Infrastructure/database"
// 	"github.com/HMZ-H/Madihome/migrations"
// 	"github.com/joho/godotenv"
// )

// func main() {
// 	// Load environment variables
// 	if err := godotenv.Load(); err != nil {
// 		log.Println("No .env file found, using system environment variables")
// 	}

// 	// Connect to database
// 	db, err := database.ConnectDatabase()
// 	if err != nil {
// 		log.Fatal("Failed to connect to database:", err)
// 	}
// 	log.Println("Database connected successfully")

// 	// Apply indexes
// 	log.Println("Applying database indexes...")
// 	if err := migrations.AddMessagesIndexes(db); err != nil {
// 		log.Fatal("Failed to apply indexes:", err)
// 	}

// 	log.Println("✅ Database indexes applied successfully!")
// 	log.Println("The slow SQL queries should now be fast (<10ms)")
// 	os.Exit(0)
// }
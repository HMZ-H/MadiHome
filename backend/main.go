package main

import (
	"log"
	"os"

	"github.com/HMZ-H/Madihome/Delivery/controller"
	"github.com/HMZ-H/Madihome/Delivery/router"
	"github.com/HMZ-H/Madihome/Infrastructure/database"
	"github.com/HMZ-H/Madihome/Infrastructure/email"
	"github.com/HMZ-H/Madihome/Infrastructure/middleware"
	"github.com/HMZ-H/Madihome/Infrastructure/security"
	repository "github.com/HMZ-H/Madihome/Repository"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading .env file, proceeding with system environment variables")
		log.Println("Error:", err)
	}

	// Debug: Check if DATABASE_URL is loaded
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Println("WARNING: DATABASE_URL is empty!")
	} else {
		log.Println("DATABASE_URL loaded successfully")
	}
	// Connect to the database
	db, err := database.ConnectDatabase()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	log.Println("Database connected successfully")

	// Initialize services
	userRepo := repository.NewUserRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	homecareServiceRepo := repository.NewHomecareServiceRepository(db)
	homecarePlanRepo := repository.NewHomecarePlanRepository(db)
	homecareVisitRepo := repository.NewHomecareVisitRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	jwtService := security.NewJWTService()
	hashService := security.NewPasswordService()
	emailService := email.NewEmailService()
	userUsecase := usecases.NewUserUsecase(userRepo, hashService, jwtService, emailService)
	doctorUsecase := usecases.NewDoctorUsecase(doctorRepo)
	homecareServiceUsecase := usecases.NewHomecareUsecaseService(homecareServiceRepo, doctorRepo)
	homecarePlanUsecase := usecases.NewHomecarePlanUsecase(homecarePlanRepo)
	homecareVisitUsecase := usecases.NewHomecareVisitUsecase(homecareVisitRepo)
	bookingUsecase := usecases.NewBookingUsecase(bookingRepo, homecareServiceRepo, userRepo)

	// initialize  controllers
	userController := controller.NewUserController(userUsecase)
	authController := controller.NewAuthController(userUsecase, jwtService, emailService)
	doctorController := controller.NewDoctorController(doctorUsecase)
	homecareServiceController := controller.NewHomecareServiceController(homecareServiceUsecase)
	homecarePlanController := controller.NewHomecarePlanController(homecarePlanUsecase)
	homecareVisitController := controller.NewHomecareVisitController(homecareVisitUsecase)
	bookingController := controller.NewBookingController(bookingUsecase)

	// Set up Gin router
	r := gin.Default()
	r.Use(middleware.CORSMiddleware())
	r = router.SetupRouter(userController, authController, doctorController, homecareServiceController, homecarePlanController, homecareVisitController, bookingController, jwtService)

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Starting server on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}

}

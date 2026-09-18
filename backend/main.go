package main

import (
	"log"
	"os"

	"github.com/HMZ-H/Madihome/Delivery/controller"
	"github.com/HMZ-H/Madihome/Delivery/router"
	"github.com/HMZ-H/Madihome/Infrastructure/ai"
	"github.com/HMZ-H/Madihome/Infrastructure/database"
	"github.com/HMZ-H/Madihome/Infrastructure/email"
	"github.com/HMZ-H/Madihome/Infrastructure/realtime"
	"github.com/HMZ-H/Madihome/Infrastructure/security"
	"github.com/HMZ-H/Madihome/Infrastructure/storage"
	repository "github.com/HMZ-H/Madihome/Repository"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/HMZ-H/Madihome/migrations"
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

	// Run migrations
	if err := migrations.FixUserRoles(db); err != nil {
		log.Printf("Migration warning: %v", err)
	}

	// Create AI chat messages table
	if err := migrations.CreateChatMessagesTable(db); err != nil {
		log.Printf("Migration warning: %v", err)
	}

	// Add indexes to messages table for better performance
	if err := migrations.AddMessagesIndexes(db); err != nil {
		log.Printf("Migration warning: %v", err)
	}

	// Initialize services
	userRepo := repository.NewUserRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	homecareServiceRepo := repository.NewHomecareServiceRepository(db)
	homecarePlanRepo := repository.NewHomecarePlanRepository(db)
	homecareVisitRepo := repository.NewHomecareVisitRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	roleRequestRepo := repository.NewRoleRequestRepository(db)
	jwtService := security.NewJWTService()
	hashService := security.NewPasswordService()
	emailService := email.NewEmailService()

	// Initialize Cloudinary storage service
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if len(apiSecret) > 8 {
		log.Printf("Cloudinary Config - CloudName: %s, APIKey: %s, APISecret: %s",
			cloudName, apiKey, apiSecret[:8]+"...")
	} else {
		log.Printf("Cloudinary Config - CloudName: %s, APIKey: %s, APISecret: [EMPTY]",
			cloudName, apiKey)
	}

	cloudinaryService, err := storage.NewCloudinaryService(cloudName, apiKey, apiSecret)
	if err != nil {
		log.Fatal("Failed to initialize Cloudinary service:", err)
	}
	log.Println("Cloudinary service initialized successfully")

	userUsecase := usecases.NewUserUsecase(userRepo, hashService, jwtService, emailService)
	doctorUsecase := usecases.NewDoctorUsecase(doctorRepo, userRepo)
	homecareServiceUsecase := usecases.NewHomecareUsecaseService(homecareServiceRepo, doctorRepo)
	homecarePlanUsecase := usecases.NewHomecarePlanUsecase(homecarePlanRepo)
	homecareVisitUsecase := usecases.NewHomecareVisitUsecase(homecareVisitRepo)
	bookingUsecase := usecases.NewBookingUsecase(bookingRepo, homecareServiceRepo, userRepo)
	roleRequestUsecase := usecases.NewRoleRequestUsecase(roleRequestRepo, userRepo, doctorRepo)

	// Initialize notification system
	notificationRepo := repository.NewNotificationRepository(db)
	notificationUsecase := usecases.NewNotificationUsecase(notificationRepo, userRepo, doctorRepo)

	// Initialize message system
	messageRepo := repository.NewMessageRepository(db)
	messageUsecase := usecases.NewMessageUsecase(messageRepo, nil) // Will be set later with the shared hub

	// Initialize AI system with provider selection
	provider := os.Getenv("AI_PROVIDER") // "openai" or "gemini"
	if provider == "" {
		provider = "openai"
	}

	var aiService ai.AIServiceInterface
	switch provider {
	case "gemini":
		geminiAPIKey := os.Getenv("GEMINI_API_KEY")
		geminiModel := os.Getenv("GEMINI_MODEL")
		if geminiModel == "" {
			geminiModel = "gemini-1.5-flash"
		}
		aiService = ai.NewGeminiService(geminiAPIKey, geminiModel)
		if geminiAPIKey != "" {
			log.Println("AI service initialized successfully with Gemini")
		} else {
			log.Println("WARNING: GEMINI_API_KEY not found, AI service may not work properly")
		}
	default:
		openaiAPIKey := os.Getenv("OPENAI_API_KEY")
		openaiModel := os.Getenv("OPENAI_MODEL")
		if openaiModel == "" {
			openaiModel = "gpt-3.5-turbo" // Default model
		}
		aiService = ai.NewOpenAIService(openaiAPIKey, openaiModel)
		if openaiAPIKey != "" {
			log.Println("AI service initialized successfully with OpenAI")
		} else {
			log.Println("WARNING: OPENAI_API_KEY not found, AI service may not work properly")
		}
	}
	aiRepo := repository.NewAIChatRepository(db)
	aiUsecase := usecases.NewHomecareAIAssistantUsecase(aiService, aiRepo)

	// provider-specific logs are above

	// initialize  controllers
	userController := controller.NewUserController(userUsecase)
	authController := controller.NewAuthController(userUsecase, jwtService, emailService)
	doctorController := controller.NewDoctorController(doctorUsecase)
	homecareServiceController := controller.NewHomecareServiceController(homecareServiceUsecase)
	homecarePlanController := controller.NewHomecarePlanController(homecarePlanUsecase)
	homecareVisitController := controller.NewHomecareVisitController(homecareVisitUsecase)
	bookingController := controller.NewBookingController(bookingUsecase, doctorRepo, notificationUsecase)
	notificationController := controller.NewNotificationController(notificationUsecase)
	fileController := controller.NewFileController(cloudinaryService)
	adminController := controller.NewAdminController(userUsecase, doctorUsecase, bookingUsecase)
	roleRequestController := controller.NewRoleRequestController(roleRequestUsecase)
	messageController := controller.NewMessageController(messageUsecase)
	aiController := controller.NewHomecareAIHandler(aiUsecase)
	// Realtime hub & WS controller
	hub := realtime.NewHub()
	// Update message usecase with the shared hub
	messageUsecase.Hub = hub
	wsController := controller.NewWSController(hub, jwtService, messageUsecase)

	// Set up Gin router
	r := router.SetupRouter(userController, authController, doctorController, homecareServiceController, homecarePlanController, homecareVisitController, bookingController, notificationController, fileController, adminController, roleRequestController, messageController, aiController, wsController, jwtService)

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

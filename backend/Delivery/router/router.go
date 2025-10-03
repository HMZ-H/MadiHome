package router

import (
	"github.com/HMZ-H/Madihome/Delivery/controller"
	"github.com/HMZ-H/Madihome/Infrastructure/middleware"
	"github.com/HMZ-H/Madihome/Infrastructure/security"
	"github.com/gin-gonic/gin"
)

func SetupRouter(userController *controller.UserController,
	AuthController *controller.AuthController,
	doctorController *controller.DoctorController,
	homecareServiceController *controller.HomecareServiceController,
	homecarePlanController *controller.HomecarePlanController,
	homecareVisitController *controller.HomecareVisitController,
	bookingController *controller.BookingController,
	jwtService *security.JWTService) *gin.Engine {
	r := gin.Default()

	// Public routes
	public := r.Group("/api")
	{
		public.POST("/register", AuthController.Register)
		public.POST("/login", AuthController.Login)
		public.POST("/refresh-token", AuthController.RefreshToken)
		public.GET("/auth/google", AuthController.GoogleLogin)
		public.GET("/auth/google/login", AuthController.GoogleLogin)
		public.GET("/auth/google/callback", AuthController.GoogleCallback)

		// Email verification routes
		public.GET("/verify-email/:token", AuthController.VerifyEmail)
		public.POST("/resend-verification", AuthController.ResendVerificationEmail)
		public.POST("/forgot-password", AuthController.ForgotPassword)
		public.POST("/reset-password/:token", AuthController.ResetPasswordWithToken)

		// Public homecare service routes (for users to view available services)
		public.GET("/services", homecareServiceController.GetAllHomecareServices)
		public.GET("/services/:id", homecareServiceController.GetHomecareServiceByID)
	}

	// Protected routes
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware(jwtService))
	{
		protected.GET("/me", userController.Me)
		protected.PUT("/users/:id", userController.UpdateUser)
		protected.POST("/users/:id/change-password", userController.ChangePassword)
	}

	// User/Patient routes (authenticated users can view their own data)
	user := protected.Group("/user")
	user.Use(middleware.RequireUser())
	{
		// Users can create and view their own bookings
		user.POST("/bookings", bookingController.CreateBooking)
		user.GET("/bookings", bookingController.GetUserBookings)
		user.GET("/bookings/:id", bookingController.GetBookingByID)

		// Users can view their own visits and care plans
		user.GET("/visits", homecareVisitController.GetHomecareVisitsByUserID)
		user.GET("/visits/:id", homecareVisitController.GetHomecareVisitByID)
		user.GET("/care-plans", homecarePlanController.GetHomecarePlansByUser)
		user.GET("/care-plans/:id", homecarePlanController.GetHomecarePlanByID)
	}

	// Doctor-only routes (admin functions)
	doctor := protected.Group("/doctor")
	doctor.Use(middleware.RequireDoctor())
	{
		// Patient management routes (only show patients, not other doctors)
		doctor.GET("/patients", userController.GetDoctorPatients)
		doctor.GET("/patients/:id", userController.GetUserByID)
		doctor.DELETE("/patients/:id", userController.DeleteUser)
		doctor.POST("/patients/:id/reset-password", userController.ResetPassword)
		doctor.POST("/patients/:id/verify", userController.VerifyUser)

		// Doctor management routes (view only for regular doctors)
		doctor.GET("/doctors", doctorController.GetAllDoctors)
		doctor.GET("/doctors/:id", doctorController.GetDoctorByID)

		// Homecare service management (doctors can manage services)
		doctor.POST("/services", homecareServiceController.CreateHomecareService)
		doctor.POST("/services/bulk", homecareServiceController.BulkCreateHomecareServices)
		doctor.GET("/services", homecareServiceController.GetHomecareServicesByDoctor)
		doctor.PUT("/services/:id", homecareServiceController.UpdateHomecareService)
		doctor.DELETE("/services/:id", homecareServiceController.DeleteHomecareService)

		// Homecare plan management (doctors can manage plans)
		doctor.POST("/plans", homecarePlanController.CreateHomecarePlan)
		doctor.GET("/plans", homecarePlanController.GetHomecarePlansByDoctor)
		doctor.GET("/plans/:id", homecarePlanController.GetHomecarePlanByID)
		doctor.PUT("/plans/:id", homecarePlanController.UpdateHomecarePlan)
		doctor.DELETE("/plans/:id", homecarePlanController.DeleteHomecarePlan)

		// Booking management (doctors can manage bookings)
		doctor.GET("/bookings", bookingController.GetDoctorBookings)
		doctor.GET("/bookings/pending", bookingController.GetPendingBookings)
		doctor.GET("/bookings/:id", bookingController.GetBookingByID)
		doctor.PUT("/bookings/:id", bookingController.UpdateBooking)
		doctor.PUT("/bookings/:id/complete", bookingController.CompleteBooking)
		doctor.DELETE("/bookings/:id", bookingController.DeleteBooking)

		// Homecare visit management (doctors can manage visits)
		doctor.POST("/visits", homecareVisitController.CreateHomecareVisit)
		doctor.GET("/visits", homecareVisitController.GetHomecareVisitsByUserID)
		doctor.GET("/visits/:id", homecareVisitController.GetHomecareVisitByID)
		doctor.PUT("/visits/:id", homecareVisitController.UpdateHomecareVisit)
		doctor.DELETE("/visits/:id", homecareVisitController.DeleteHomecareVisit)
	}

	// Super Admin routes (only super admin can create/manage doctors)
	superAdmin := protected.Group("/admin")
	superAdmin.Use(middleware.RequireSuperAdmin())
	{
		// Super admin can see all users
		superAdmin.GET("/users", userController.GetAllUsers)

		// Super admin can create/manage doctors
		superAdmin.POST("/doctors", doctorController.CreateDoctor)
		superAdmin.PUT("/doctors/:id", doctorController.UpdateDoctor)
		superAdmin.DELETE("/doctors/:id", doctorController.DeleteDoctor)
	}

	// Public doctor routes (for users to view doctors)
	public.GET("/doctors", doctorController.GetAllDoctors)
	public.GET("/doctors/:id", doctorController.GetDoctorByID)

	return r
}

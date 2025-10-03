package controller

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Infrastructure/email"
	"github.com/HMZ-H/Madihome/Infrastructure/oauth"
	"github.com/HMZ-H/Madihome/Infrastructure/security"
	usecases "github.com/HMZ-H/Madihome/Usecases"
	"github.com/gin-gonic/gin"
)

type AuthController struct {
	userUsecase  usecases.UserUsecaseInterface
	jwtService   *security.JWTService
	emailService *email.EmailService
}

func NewAuthController(userUsecase usecases.UserUsecaseInterface, jwtService *security.JWTService, emailService *email.EmailService) *AuthController {
	return &AuthController{
		userUsecase:  userUsecase,
		jwtService:   jwtService,
		emailService: emailService,
	}
}

// Register handles user registration with role specified in request body
func (a *AuthController) Register(c *gin.Context) {
	var req schema.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Invalid request format: " + err.Error()})
		return
	}
	// Debug: Log received request data
	log.Printf("Received request: FirstName=%s, LastName=%s, Email=%s", req.FirstName, req.LastName, req.Email)

	// Validate role
	if req.Role == "" {
		req.Role = "user"
	}

	user, err := a.userUsecase.Register(&req)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "user already exists" {
			status = http.StatusConflict
		}
		c.JSON(status, schema.ErrorResponse{Success: false, Message: err.Error()})
		return
	}

	// Send verification email
	verificationToken, err := a.userUsecase.GenerateVerificationToken(user.ID, user.Email)
	if err != nil {
		log.Printf("Failed to generate verification token: %v", err)
	} else {
		log.Printf("Generated verification token for %s: %s", user.Email, verificationToken)
		err = a.emailService.SendVerificationEmail(user.Email, verificationToken)
		if err != nil {
			log.Printf("Failed to send verification email to %s: %v", user.Email, err)
			log.Printf("Use this URL to verify: http://localhost:8080/api/verify-email/%s", verificationToken)
		} else {
			log.Printf("Verification email sent successfully to %s", user.Email)
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully. Please check your email to verify your account.",
		"user":    user,
	})
}

// Login authenticates a user (user/doctor)
func (a *AuthController) Login(c *gin.Context) {
	var req schema.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Invalid request format: " + err.Error()})
		return
	}
	accessToken, refreshToken, userResp, err := a.userUsecase.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{Success: false, Message: "Invalid credentials"})
		return
	}

	// Check if user is verified
	if !userResp.IsVerified {
		c.JSON(http.StatusForbidden, schema.ErrorResponse{
			Success: false,
			Message: "Please verify your email before logging in. Check your email for verification link.",
		})
		return
	}
	c.JSON(http.StatusOK, schema.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         userResp,
	})
}

// RefreshToken generates a new access token using a valid refresh token
func (a *AuthController) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Invalid request: " + err.Error()})
		return
	}

	// Validate the refresh token
	claims, err := a.jwtService.ValidateToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{Success: false, Message: "Invalid or expired refresh token"})
		return
	}

	// Extract claims
	userID := uint(claims["user_id"].(float64))
	email := claims["email"].(string)
	role := claims["role"].(string)

	// Generate a new access token
	newAccessToken, err := a.jwtService.GenerateToken(userID, email, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: "Failed to generate access token"})
		return
	}

	// Optionally, generate a new refresh token
	newRefreshToken, err := a.jwtService.GenerateRefreshToken(userID, email, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: "Failed to generate refresh token"})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Token refreshed successfully",
		Data: gin.H{
			"access_token":  newAccessToken,
			"refresh_token": newRefreshToken,
		},
	})
}

// Google Login redirects to Google's OAuth consent screen
func (a *AuthController) GoogleLogin(c *gin.Context) {
	url := fmt.Sprintf(
		"https://accounts.google.com/o/oauth2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=email profile",
		os.Getenv("GOOGLE_OAUTH_CLIENT_ID"),
		os.Getenv("GOOGLE_OAUTH_REDIRECT_URL"),
	)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallback handles the OAuth callback from Google
func (a *AuthController) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Code not found in query parameters"})
		return
	}
	token, err := oauth.ExchangeCodeForToken(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: "Failed to exchange code for token: " + err.Error()})
		return
	}
	info, err := oauth.GetUserInfo(token.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: "Failed to get user info: " + err.Error()})
		return
	}
	email, _ := info["email"].(string)
	if email == "" {
		c.JSON(http.StatusUnauthorized, schema.ErrorResponse{Success: false, Message: "Email not found in Google user info"})
		return
	}
	user, err := a.userUsecase.GetUserByEmail(email)
	if err != nil || user == nil {
		// Auto-register Google user if they don't exist
		googleUser := &schema.CreateUserRequest{
			FirstName: info["given_name"].(string),
			LastName:  info["family_name"].(string),
			Email:     email,
			Password:  "", // No password for Google users
			Phone:     "",
			Gender:    "",
			Birthday:  "",
			Address:   "",
			Role:      "user",
		}

		user, err = a.userUsecase.RegisterGoogleUser(googleUser)
		if err != nil {
			c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: "Failed to create user account"})
			return
		}
	}
	accessToken, err := a.jwtService.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: "Failed to generate access token"})
		return
	}
	refreshToken, err := a.jwtService.GenerateRefreshToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{Success: false, Message: "Failed to generate refresh token"})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Login successful",
		Data:    gin.H{"access_token": accessToken, "refresh_token": refreshToken, "user": user},
	})
}

// VerifyEmail handles email verification
func (a *AuthController) VerifyEmail(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Verification token is required"})
		return
	}

	// TODO: Implement email verification logic
	claims, err := a.userUsecase.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid verification token",
		})
		return
	}
	err = a.userUsecase.VerifyUser(uint(claims["user_id"].(float64)))
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to verify user",
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Email verified successfully",
	})

}

// ResendVerificationEmail resends verification email
func (a *AuthController) ResendVerificationEmail(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Email is required"})
		return
	}

	// TODO: Implement resend verification logic
	user, err := a.userUsecase.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}
	verificationToken, err := a.userUsecase.GenerateVerificationToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to generate verification token",
		})
		return
	}
	err = a.emailService.SendVerificationEmail(user.Email, verificationToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to send verification email",
		})
		return
	}
	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Verification email sent successfully",
	})

}

// ForgotPassword handles forgot password request
func (a *AuthController) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Email is required"})
		return
	}

	// TODO: Implement forgot password logic
	user, err := a.userUsecase.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}
	resetToken, err := a.userUsecase.GenerateResetToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to generate reset token",
		})
		return
	}
	err = a.emailService.SendPasswordResetEmail(user.Email, resetToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to send password reset email",
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Password reset email sent successfully",
	})
}

// ResetPasswordWithToken handles password reset with token
func (a *AuthController) ResetPasswordWithToken(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "Reset token is required"})
		return
	}

	var req struct {
		NewPassword string `json:"new_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{Success: false, Message: "New password is required"})
		return
	}

	// TODO: Implement password reset logic
	claims, err := a.userUsecase.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusBadRequest, schema.ErrorResponse{
			Success: false,
			Message: "Invalid reset token",
		})
		return
	}
	err = a.userUsecase.ResetPassword(uint(claims["user_id"].(float64)), req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schema.ErrorResponse{
			Success: false,
			Message: "Failed to reset password",
		})
		return
	}

	c.JSON(http.StatusOK, schema.SuccessResponse{
		Success: true,
		Message: "Password reset successfully",
	})
}

package middleware

import (
	"net/http"
	"strings"

	"github.com/HMZ-H/Madihome/Infrastructure/security"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(jwtService *security.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"success": false, "message": "Authorization header is required"})
			c.Abort()
			return
		}

		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(401, gin.H{
				"success": false,
				"message": "Invalid authorization format. Use 'Bearer <token>'",
			})
			c.Abort()
			return
		}
		// Extract token
		token := strings.TrimPrefix(authHeader, "Bearer ")

		// Validate token
		claims, err := jwtService.ValidateToken(token)
		if err != nil {
			c.JSON(401, gin.H{
				"success": false,
				"message": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Extracte user information from claim
		userID, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid token claims",
			})
			c.Abort()
			return
		}
		email, ok := claims["email"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid token claims",
			})
			c.Abort()
			return
		}

		role, ok := claims["role"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid token claim",
			})
			c.Abort()
			return
		}

		// set user information in context
		c.Set("user_id", uint(userID))
		c.Set("email", email)
		c.Set("role", role)
		c.Next()
	}
}

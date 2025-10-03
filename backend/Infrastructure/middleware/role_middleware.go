package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func RequireRole(allowedRole ...string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		role, exists := ctx.Get("role")
		if !exists {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "User role not found in context",
			})
			ctx.Abort()
			return
		}
		role, ok := role.(string)
		if !ok {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid user role format",
			})
			ctx.Abort()
			return
		}
		hasParmission := false
		for _, allowed := range allowedRole {
			if role == allowed {
				hasParmission = true
				break
			}
		}
		if !hasParmission {
			ctx.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Access denied: Required role " + strings.Join(allowedRole, ", "),
			})
			ctx.Abort()
			return
		}
		ctx.Next()
	}
}

func RequireUser() gin.HandlerFunc {
	return RequireRole("user")
}

func RequireDoctor() gin.HandlerFunc {
	return RequireRole("doctor")
}

func RequireSuperAdmin() gin.HandlerFunc {
	return RequireRole("super_admin")
}

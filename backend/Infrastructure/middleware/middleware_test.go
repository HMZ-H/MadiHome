package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/HMZ-H/Madihome/Infrastructure/security"
	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func setupTestJWT() *security.JWTService {
	os.Setenv("JWT_SECRET", "test-middleware-secret")
	return security.NewJWTService()
}

func TestAuthMiddlewareNoHeader(t *testing.T) {
	jwtSvc := setupTestJWT()
	r := gin.New()
	r.Use(AuthMiddleware(jwtSvc))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != 401 {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddlewareInvalidFormat(t *testing.T) {
	jwtSvc := setupTestJWT()
	r := gin.New()
	r.Use(AuthMiddleware(jwtSvc))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Basic abc123")
	r.ServeHTTP(w, req)

	if w.Code != 401 {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddlewareInvalidToken(t *testing.T) {
	jwtSvc := setupTestJWT()
	r := gin.New()
	r.Use(AuthMiddleware(jwtSvc))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	r.ServeHTTP(w, req)

	if w.Code != 401 {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddlewareValidToken(t *testing.T) {
	jwtSvc := setupTestJWT()
	token, _ := jwtSvc.GenerateToken(5, "doc@test.com", "doctor")

	r := gin.New()
	r.Use(AuthMiddleware(jwtSvc))
	r.GET("/test", func(c *gin.Context) {
		uid, _ := c.Get("user_id")
		email, _ := c.Get("email")
		role, _ := c.Get("role")
		c.JSON(200, gin.H{"user_id": uid, "email": email, "role": role})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestRequireRoleAllowed(t *testing.T) {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("role", "doctor")
		c.Next()
	})
	r.Use(RequireRole("doctor", "admin"))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestRequireRoleDenied(t *testing.T) {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("role", "user")
		c.Next()
	})
	r.Use(RequireRole("doctor"))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != 403 {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestRequireRoleNoRole(t *testing.T) {
	r := gin.New()
	r.Use(RequireRole("doctor"))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != 401 {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestRequireSuperAdmin(t *testing.T) {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("role", "super_admin")
		c.Next()
	})
	r.Use(RequireSuperAdmin())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestCORSMiddlewareAllowedOrigin(t *testing.T) {
	os.Setenv("ALLOWED_ORIGINS", "http://localhost:5173,http://example.com")
	defer os.Unsetenv("ALLOWED_ORIGINS")

	r := gin.New()
	r.Use(CORSMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	r.ServeHTTP(w, req)

	if w.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Errorf("expected allowed origin, got %q", w.Header().Get("Access-Control-Allow-Origin"))
	}
	if w.Header().Get("Access-Control-Allow-Credentials") != "true" {
		t.Error("expected credentials header")
	}
}

func TestCORSMiddlewareDisallowedOrigin(t *testing.T) {
	os.Setenv("ALLOWED_ORIGINS", "http://localhost:5173")
	defer os.Unsetenv("ALLOWED_ORIGINS")

	r := gin.New()
	r.Use(CORSMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "http://evil.com")
	r.ServeHTTP(w, req)

	if w.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Errorf("expected no origin header for disallowed origin, got %q", w.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestCORSMiddlewarePreflight(t *testing.T) {
	os.Setenv("ALLOWED_ORIGINS", "http://localhost:5173")
	defer os.Unsetenv("ALLOWED_ORIGINS")

	r := gin.New()
	r.Use(CORSMiddleware())
	r.OPTIONS("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("OPTIONS", "/test", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	r.ServeHTTP(w, req)

	if w.Code != 204 {
		t.Errorf("expected 204 for preflight, got %d", w.Code)
	}
}

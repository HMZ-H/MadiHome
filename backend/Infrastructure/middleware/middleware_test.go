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

// --- Rate Limiter Tests ---

func TestRateLimit_AllowsWithinBurst(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", RateLimit(10), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	for i := 0; i < 10; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "10.0.0.1:1234"
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i, w.Code)
		}
	}
}

func TestRateLimit_BlocksOverBurst(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", RateLimit(2), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// Exhaust burst of 2
	for i := 0; i < 2; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "10.0.0.2:1234"
		r.ServeHTTP(w, req)
	}

	// Third request should be blocked
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "10.0.0.2:1234"
	r.ServeHTTP(w, req)
	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", w.Code)
	}
}

func TestRateLimit_DifferentIPsIndependent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", RateLimit(1), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// IP1 uses its single token
	w1 := httptest.NewRecorder()
	req1, _ := http.NewRequest("GET", "/test", nil)
	req1.RemoteAddr = "10.0.0.3:1234"
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("IP1: expected 200, got %d", w1.Code)
	}

	// IP2 should still be allowed
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/test", nil)
	req2.RemoteAddr = "10.0.0.4:1234"
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("IP2: expected 200, got %d", w2.Code)
	}
}

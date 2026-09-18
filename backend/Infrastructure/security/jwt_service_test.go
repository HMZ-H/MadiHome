package security

import (
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestNewJWTServiceDefaultSecret(t *testing.T) {
	os.Unsetenv("JWT_SECRET")
	svc := NewJWTService()
	if svc == nil {
		t.Fatal("expected non-nil JWTService")
	}
	if string(svc.jwtSecret) != "default-secret-key" {
		t.Fatalf("expected default secret, got %q", string(svc.jwtSecret))
	}
}

func TestNewJWTServiceEnvSecret(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-123")
	defer os.Unsetenv("JWT_SECRET")
	svc := NewJWTService()
	if string(svc.jwtSecret) != "test-secret-123" {
		t.Fatalf("expected env secret, got %q", string(svc.jwtSecret))
	}
}

func TestGenerateAndValidateToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")
	svc := NewJWTService()

	tokenStr, err := svc.GenerateToken(42, "test@example.com", "doctor")
	if err != nil {
		t.Fatalf("GenerateToken error: %v", err)
	}
	if tokenStr == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := svc.ValidateToken(tokenStr)
	if err != nil {
		t.Fatalf("ValidateToken error: %v", err)
	}

	userID, ok := claims["user_id"].(float64)
	if !ok || uint(userID) != 42 {
		t.Errorf("expected user_id 42, got %v", claims["user_id"])
	}
	email, ok := claims["email"].(string)
	if !ok || email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %v", claims["email"])
	}
	role, ok := claims["role"].(string)
	if !ok || role != "doctor" {
		t.Errorf("expected role doctor, got %v", claims["role"])
	}
}

func TestGenerateRefreshToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")
	svc := NewJWTService()

	tokenStr, err := svc.GenerateRefreshToken(1, "user@test.com", "user")
	if err != nil {
		t.Fatalf("GenerateRefreshToken error: %v", err)
	}

	claims, err := svc.ValidateToken(tokenStr)
	if err != nil {
		t.Fatalf("ValidateToken error: %v", err)
	}

	exp, ok := claims["exp"].(float64)
	if !ok {
		t.Fatal("expected exp claim")
	}
	expTime := time.Unix(int64(exp), 0)
	if time.Until(expTime) < 6*24*time.Hour {
		t.Error("refresh token should expire in ~7 days")
	}
}

func TestValidateTokenInvalid(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")
	svc := NewJWTService()

	_, err := svc.ValidateToken("invalid.token.here")
	if err == nil {
		t.Error("expected error for invalid token")
	}
}

func TestValidateTokenExpired(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")
	svc := NewJWTService()

	claims := jwt.MapClaims{
		"user_id": 1,
		"email":   "test@test.com",
		"role":    "user",
		"exp":     time.Now().Add(-time.Hour).Unix(),
		"iat":     time.Now().Add(-2 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte("test-secret"))

	_, err := svc.ValidateToken(tokenStr)
	if err == nil {
		t.Error("expected error for expired token")
	}
}

func TestValidateTokenWrongSecret(t *testing.T) {
	os.Setenv("JWT_SECRET", "secret-a")
	defer os.Unsetenv("JWT_SECRET")
	svcA := NewJWTService()

	tokenStr, _ := svcA.GenerateToken(1, "a@b.com", "user")

	os.Setenv("JWT_SECRET", "secret-b")
	svcB := NewJWTService()

	_, err := svcB.ValidateToken(tokenStr)
	if err == nil {
		t.Error("expected error for wrong secret")
	}
}

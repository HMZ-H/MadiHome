package schema

import "time"

type CreateUserRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Password  string `json:"password" validate:"required"`
	Phone     string `json:"phone"`
	Gender    string `json:"gender"`
	Birthday  string `json:"birthday"`
	Address   string `json:"address"`
	Photo     string `json:"photo"`
	Role      string `json:"role"`
}

type UpdateUserRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Gender    string `json:"gender"`
	Birthday  string `json:"birthday"`
	Address   string `json:"address"`
	Photo     string `json:"photo"`
	Role      string `json:"role"`
}

type UserResponse struct {
	ID         uint      `json:"id"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Email      string    `json:"email"`
	Phone      string    `json:"phone"`
	Role       string    `json:"role"`
	Gender     string    `json:"gender"`
	Birthday   string    `json:"birthday"`
	Address    string    `json:"address"`
	Photo      string    `json:"photo"`
	IsVerified bool      `json:"is_verified"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	User         interface{} `json:"user"`
}
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type ErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

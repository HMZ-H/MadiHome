package Usecases

import (
	"errors"
	"time"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"github.com/golang-jwt/jwt/v5"
)

type HashService interface {
	HashPassword(password string) (string, error)
	VerifyPassword(hashedPassword, password string) bool
}

type GenerateToken interface {
	GenerateToken(userID uint, email, role string) (string, error)
	ValidateToken(token string) (jwt.MapClaims, error)
}

type EmailService interface {
	SendVerificationEmail(to, verificationToken string) error
	SendPasswordResetEmail(to, resetToken string) error
}

type UserUsecase struct {
	repo  repository.UserRepository
	hash  HashService
	jwt   GenerateToken
	email EmailService
}

// type UserUsecaseInterface interface {
// 	Register(req schemas.CreateUserRequest) (*schemas.UserResponse, error)
// 	Login(email, password string) (string, *schemas.UserResponse, error)
// 	GetUserByID(id int64) (*schemas.UserResponse, error)
// 	GetUserByEmail(email string) (*schemas.UserResponse, error)
// 	GetAllUsers(query schemas.UserListQuery) (*schemas.UserListResponse, error)
// 	UpdateUser(id int64, req schemas.UpdateUserRequest) (*schemas.UserResponse, error)
// 	ChangePassword(userID int64, oldPassword, newPassword string) error
// 	ResetPassword(userID int64, newPassword string) error
// 	VerifyUser(userID int64) error
// 	DeleteUser(id int64) error
// }

type UserUsecaseInterface interface {
	Register(req *schema.CreateUserRequest) (*schema.UserResponse, error)
	RegisterGoogleUser(req *schema.CreateUserRequest) (*schema.UserResponse, error)
	Login(req *schema.LoginRequest) (accessToken string, refreshToken string, userResp *schema.UserResponse, err error)
	GetUserByID(id uint) (*schema.UserResponse, error)
	GetUserByEmail(email string) (*schema.UserResponse, error)
	GetAllUsers() ([]*schema.UserResponse, error)
	GetUsersByRole(role string) ([]*schema.UserResponse, error)
	UpdateUser(id uint, req *schema.UpdateUserRequest) (*schema.UserResponse, error)
	ChangePassword(userID uint, oldPassword, newPassword string) error
	ResetPassword(userID uint, newPassword string) error
	VerifyUser(userID uint) error
	RefreshToken(userID uint, email, role string) (string, error)
	ValidateToken(token string) (jwt.MapClaims, error)
	GenerateVerificationToken(userID uint, email string) (string, error)
	GenerateResetToken(userID uint, email string) (string, error)
	DeleteUser(id uint) error
	DeleteUserWithCascade(id uint) error
	VerifyUserByID(userID string) (*schema.UserResponse, error)
	UnverifyUser(userID string) (*schema.UserResponse, error)
}

func NewUserUsecase(repo repository.UserRepository, hash HashService, jwt GenerateToken, email EmailService) *UserUsecase {
	return &UserUsecase{
		repo:  repo,
		hash:  hash,
		jwt:   jwt,
		email: email,
	}
}

func (uc *UserUsecase) Register(req *schema.CreateUserRequest) (*schema.UserResponse, error) {
	if exist, _ := uc.repo.GetUserByEmail(req.Email); exist != nil {
		return nil, errors.New("user already exist")
	}

	hashed, err := uc.hash.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Ensure role is always set
	userRole := req.Role
	if userRole == "" || userRole == "null" || userRole == "undefined" {
		userRole = "user"
	}

	NewUser := &entity.User{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Phone:     req.Phone,
		Gender:    req.Gender,
		Birthday:  req.Birthday,
		Address:   req.Address,
		Role:      userRole,
		Password:  string(hashed),
		CreatedAt: time.Now(),
	}
	createdUser, err := uc.repo.CreateUser(NewUser)
	if err != nil {
		return nil, err
	}
	return toUserResponse(createdUser), nil

}

func (uc *UserUsecase) RegisterGoogleUser(req *schema.CreateUserRequest) (*schema.UserResponse, error) {
	if exist, _ := uc.repo.GetUserByEmail(req.Email); exist != nil {
		return nil, errors.New("user already exist")
	}

	// Google users don't need password hashing
	NewUser := &entity.User{
		FirstName:  req.FirstName,
		LastName:   req.LastName,
		Email:      req.Email,
		Phone:      req.Phone,
		Gender:     req.Gender,
		Birthday:   req.Birthday,
		Address:    req.Address,
		Photo:      req.Photo,
		Role:       req.Role,
		Password:   "",   // No password for Google users
		IsVerified: true, // Google users are automatically verified
		CreatedAt:  time.Now(),
	}
	createdUser, err := uc.repo.CreateUser(NewUser)
	if err != nil {
		return nil, err
	}
	return toUserResponse(createdUser), nil
}

func (uc *UserUsecase) Login(req *schema.LoginRequest) (accessToken string, refreshToken string, userResp *schema.UserResponse, err error) {
	user, err := uc.repo.GetUserByEmail(req.Email)
	if err != nil {
		return "", "", nil, errors.New("invalid email or password")
	}
	if !uc.hash.VerifyPassword(user.Password, req.Password) {
		return "", "", nil, errors.New("invalid email or password")
	}
	// Ensure role is set (safety check)
	userRole := user.Role
	if userRole == "" || userRole == "null" || userRole == "undefined" {
		userRole = "user"
	}

	// Generate JWT token
	accessToken, err = uc.jwt.GenerateToken(user.ID, user.Email, userRole)
	if err != nil {
		return "", "", nil, errors.New("failed to generate token")
	}
	refreshToken, err = uc.jwt.GenerateToken(user.ID, user.Email, userRole)
	if err != nil {
		return "", "", nil, errors.New("failed to generate token")
	}

	return accessToken, refreshToken, toUserResponse(user), nil
}

func (uc *UserUsecase) GetUserByEmail(email string) (*schema.UserResponse, error) {
	userEmail, err := uc.repo.GetUserByEmail(email)
	if err != nil {
		return nil, errors.New("user by this email not found")
	}
	return toUserResponse(userEmail), nil
}

func (uc *UserUsecase) GetUserByID(id uint) (*schema.UserResponse, error) {
	userID, err := uc.repo.GetUserByID(id)
	if err != nil {
		return nil, errors.New("user by this id not found")
	}
	return toUserResponse(userID), nil
}

func (uc *UserUsecase) GetAllUsers() ([]*schema.UserResponse, error) {
	users, err := uc.repo.GetAllUsers()
	if err != nil {
		return nil, err
	}

	userResponse := make([]*schema.UserResponse, len(users))
	for ind, user := range users {
		userResponse[ind] = toUserResponse(user)
	}

	return userResponse, nil
}

func (uc *UserUsecase) GetUsersByRole(role string) ([]*schema.UserResponse, error) {
	users, err := uc.repo.GetUsersByRole(role)
	if err != nil {
		return nil, err
	}

	userResponse := make([]*schema.UserResponse, len(users))
	for ind, user := range users {
		userResponse[ind] = toUserResponse(user)
	}

	return userResponse, nil
}

func (uc *UserUsecase) UpdateUser(userID uint, req *schema.UpdateUserRequest) (*schema.UserResponse, error) {
	user, err := uc.repo.GetUserByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	user.FirstName = req.FirstName
	user.LastName = req.LastName
	user.Email = req.Email
	user.Phone = req.Phone
	user.Gender = req.Gender
	user.Birthday = req.Birthday
	user.Address = req.Address
	user.Photo = req.Photo
	user.Role = req.Role

	updatedUser, err := uc.repo.UpdateUser(user)
	if err != nil {
		return nil, err
	}

	return toUserResponse(updatedUser), nil
}

func (uc *UserUsecase) ChangePassword(useID uint, oldPassword, newPassword string) error {
	user, err := uc.repo.GetUserByID(useID)
	if err != nil {
		return err
	}

	if !uc.hash.VerifyPassword(user.Password, oldPassword) {
		return errors.New("old password not correct")
	}

	newHashedPassword, err := uc.hash.HashPassword(newPassword)
	if err != nil {
		return errors.New("field to hash password")
	}

	user.Password = newHashedPassword
	user.UpdatedAt = time.Now()
	_, err = uc.repo.UpdateUser(user)
	return err

}

func (uc *UserUsecase) ResetPassword(userID uint, newPassword string) error {
	user, err := uc.repo.GetUserByID(userID)
	if err != nil {
		return err
	}
	newHashedPassword, err := uc.hash.HashPassword(newPassword)
	if err != nil {
		return errors.New("field to hash password")
	}

	user.Password = newHashedPassword
	user.UpdatedAt = time.Now()
	_, err = uc.repo.UpdateUser(user)
	return err
}

func (uc *UserUsecase) VerifyUser(userID uint) error {
	user, err := uc.repo.GetUserByID(userID)
	if err != nil {
		return err
	}
	user.IsVerified = true
	user.UpdatedAt = time.Now()
	_, err = uc.repo.UpdateUser(user)
	return err
}

func (uc *UserUsecase) RefreshToken(userID uint, email, role string) (string, error) {
	user, err := uc.repo.GetUserByID(userID)
	if err != nil {
		return "", errors.New("user not found")
	}

	newAccessToken, err := uc.jwt.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return "", errors.New("failed to generate access token")
	}
	return newAccessToken, nil
}

func (uc *UserUsecase) ValidateToken(token string) (jwt.MapClaims, error) {
	return uc.jwt.ValidateToken(token)
}

func (uc *UserUsecase) GenerateVerificationToken(userID uint, email string) (string, error) {
	return uc.jwt.GenerateToken(userID, email, "verification")
}

func (uc *UserUsecase) GenerateResetToken(userID uint, email string) (string, error) {
	return uc.jwt.GenerateToken(userID, email, "reset")
}

func (uc *UserUsecase) DeleteUser(userID uint) error {
	_, err := uc.repo.GetUserByID(userID)
	if err != nil {
		return err
	}
	return uc.repo.DeleteUser(userID)
}

func (uc *UserUsecase) DeleteUserWithCascade(userID uint) error {
	// First verify user exists
	_, err := uc.repo.GetUserByID(userID)
	if err != nil {
		return err
	}

	// Delete all associated data in the correct order to avoid foreign key constraints
	// 1. Delete refresh tokens
	if err := uc.repo.DeleteRefreshTokensByUserID(userID); err != nil {
		return err
	}

	// 2. Delete bookings (this will cascade to homecare visits)
	if err := uc.repo.DeleteBookingsByUserID(userID); err != nil {
		return err
	}

	// 3. Delete homecare plans
	if err := uc.repo.DeleteHomecarePlansByUserID(userID); err != nil {
		return err
	}

	// 4. Delete homecare visits (if any remain)
	if err := uc.repo.DeleteHomecareVisitsByUserID(userID); err != nil {
		return err
	}

	// 5. Delete doctor record if user is a doctor
	if err := uc.repo.DeleteDoctorByUserID(userID); err != nil {
		return err
	}

	// 6. Finally delete the user
	return uc.repo.DeleteUser(userID)
}

// VerifyUserByID verifies a user by ID (admin function)
func (uc *UserUsecase) VerifyUserByID(userID string) (*schema.UserResponse, error) {
	user, err := uc.repo.GetUserByID(parseUint(userID))
	if err != nil {
		return nil, err
	}

	user.IsVerified = true
	updatedUser, err := uc.repo.UpdateUser(user)
	if err != nil {
		return nil, err
	}

	return toUserResponse(updatedUser), nil
}

// UnverifyUser unverifies a user by ID (admin function)
func (uc *UserUsecase) UnverifyUser(userID string) (*schema.UserResponse, error) {
	user, err := uc.repo.GetUserByID(parseUint(userID))
	if err != nil {
		return nil, err
	}

	user.IsVerified = false
	updatedUser, err := uc.repo.UpdateUser(user)
	if err != nil {
		return nil, err
	}

	return toUserResponse(updatedUser), nil
}

// Helper function to parse string to uint
func parseUint(s string) uint {
	// Simple implementation - in production, you'd want proper error handling
	var result uint
	for _, char := range s {
		if char >= '0' && char <= '9' {
			result = result*10 + uint(char-'0')
		}
	}
	return result
}

func toUserResponse(user *entity.User) *schema.UserResponse {
	return &schema.UserResponse{
		ID:         user.ID,
		FirstName:  user.FirstName,
		LastName:   user.LastName,
		Email:      user.Email,
		Phone:      user.Phone,
		Gender:     user.Gender,
		Birthday:   user.Birthday,
		Address:    user.Address,
		Photo:      user.Photo,
		Role:       user.Role,
		IsVerified: user.IsVerified,
		CreatedAt:  user.CreatedAt,
		UpdatedAt:  user.UpdatedAt,
	}
}

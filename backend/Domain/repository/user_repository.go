package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type UserRepository interface {
	CreateUser(user *entity.User) (*entity.User, error)
	GetUserByEmail(email string) (*entity.User, error)
	GetUserByID(id uint) (*entity.User, error)
	GetAllUsers() ([]*entity.User, error)
	GetUsersByRole(role string) ([]*entity.User, error)
	UpdateUser(user *entity.User) (*entity.User, error)
	DeleteUser(id uint) error
}

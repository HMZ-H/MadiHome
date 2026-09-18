package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) repository.UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(user *entity.User) (*entity.User, error) {
	err := r.db.Create(user).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) GetUserByEmail(email string) (*entity.User, error) {
	var user entity.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetUserByID(id uint) (*entity.User, error) {
	var user entity.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetAllUsers() ([]*entity.User, error) {
	var users []*entity.User
	err := r.db.Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepository) GetUsersByRole(role string) ([]*entity.User, error) {
	var users []*entity.User
	err := r.db.Where("role = ?", role).Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepository) UpdateUser(user *entity.User) (*entity.User, error) {
	err := r.db.Save(user).Error
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) DeleteUser(id uint) error {
	var user entity.User
	err := r.db.Delete(&user, id).Error
	if err != nil {
		return err
	}
	return nil
}

// Cascade deletion methods
func (r *UserRepository) DeleteRefreshTokensByUserID(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&entity.RefreshToken{}).Error
}

func (r *UserRepository) DeleteBookingsByUserID(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&entity.Booking{}).Error
}

func (r *UserRepository) DeleteHomecarePlansByUserID(userID uint) error {
	return r.db.Where("patient_id = ?", userID).Delete(&entity.HomecarePlan{}).Error
}

func (r *UserRepository) DeleteHomecareVisitsByUserID(userID uint) error {
	return r.db.Where("patient_id = ?", userID).Delete(&entity.HomecareVisit{}).Error
}

func (r *UserRepository) DeleteDoctorByUserID(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&entity.Doctor{}).Error
}

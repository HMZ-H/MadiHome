package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"gorm.io/gorm"
)

type DoctorRepository struct {
	db *gorm.DB
}

func NewDoctorRepository(db *gorm.DB) repository.DoctorRepository {
	return &DoctorRepository{db: db}
}

func (r *DoctorRepository) CreateDoctor(doctor *entity.Doctor) (*entity.Doctor, error) {
	err := r.db.Create(doctor).Error
	if err != nil {
		return nil, err
	}
	// Preload user relationship
	err = r.db.Preload("User").First(doctor, doctor.ID).Error
	if err != nil {
		return nil, err
	}
	return doctor, nil
}

func (r *DoctorRepository) GetDoctorByID(id uint) (*entity.Doctor, error) {
	var doctor entity.Doctor
	err := r.db.Preload("User").First(&doctor, id).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

func (r *DoctorRepository) GetDoctorByUserID(userID uint) (*entity.Doctor, error) {
	var doctor entity.Doctor
	err := r.db.Preload("User").Where("user_id = ?", userID).First(&doctor).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

func (r *DoctorRepository) GetDoctorByEmail(email string) (*entity.Doctor, error) {
	var doctor entity.Doctor
	err := r.db.Preload("User").Joins("JOIN users ON users.id = doctors.user_id").Where("users.email = ?", email).First(&doctor).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

func (r *DoctorRepository) GetAllDoctors() ([]*entity.Doctor, error) {
	var doctors []*entity.Doctor
	err := r.db.Preload("User").Find(&doctors).Error
	if err != nil {
		return nil, err
	}
	return doctors, nil
}

func (r *DoctorRepository) UpdateDoctor(doctor *entity.Doctor) (*entity.Doctor, error) {
	err := r.db.Save(doctor).Error
	if err != nil {
		return nil, err
	}
	// Preload user relationship
	err = r.db.Preload("User").First(doctor, doctor.ID).Error
	if err != nil {
		return nil, err
	}
	return doctor, nil
}

func (r *DoctorRepository) DeleteDoctor(id uint) error {
	var doctor entity.Doctor
	err := r.db.Delete(&doctor, id).Error
	if err != nil {
		return err
	}
	return nil
}

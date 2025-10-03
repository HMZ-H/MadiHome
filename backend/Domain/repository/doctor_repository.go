package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type DoctorRepository interface {
	CreateDoctor(doctor *entity.Doctor) (*entity.Doctor, error)
	GetDoctorByID(id uint) (*entity.Doctor, error)
	GetDoctorByUserID(userID uint) (*entity.Doctor, error)
	GetDoctorByEmail(email string) (*entity.Doctor, error)
	GetAllDoctors() ([]*entity.Doctor, error)
	UpdateDoctor(doctor *entity.Doctor) (*entity.Doctor, error)
	DeleteDoctor(id uint) error
}

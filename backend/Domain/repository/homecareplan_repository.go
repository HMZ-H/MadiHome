package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type HomecarePlanRepository interface {

	// CarePlan methods
	CreateCarePlan(plan *entity.HomecarePlan) (*entity.HomecarePlan, error)
	GetCarePlanByID(id uint) (*entity.HomecarePlan, error)
	GetCarePlansByTitle(title string) (*entity.HomecarePlan, error)
	GetCarePlansByDoctor(doctorID uint) ([]*entity.HomecarePlan, error)
	GetCarePlansByUser(userID uint) ([]*entity.HomecarePlan, error)
	UpdateCarePlan(plan *entity.HomecarePlan) (*entity.HomecarePlan, error)
	DeleteCarePlan(id uint) error
}

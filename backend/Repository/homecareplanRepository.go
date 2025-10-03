package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"gorm.io/gorm"
)

type HomecarePlanRepository struct {
	db *gorm.DB
}

func NewHomecarePlanRepository(db *gorm.DB) repository.HomecarePlanRepository {
	return &HomecarePlanRepository{db: db}
}

// CarePlan methods
func (r *HomecarePlanRepository) CreateCarePlan(plan *entity.HomecarePlan) (*entity.HomecarePlan, error) {
	err := r.db.Create(plan).Error
	if err != nil {
		return nil, err
	}
	// Preload relationships
	err = r.db.Preload("Patient").Preload("Doctor").First(plan, plan.ID).Error
	if err != nil {
		return nil, err
	}
	return plan, nil
}

func (r *HomecarePlanRepository) GetCarePlanByID(id uint) (*entity.HomecarePlan, error) {
	var plan entity.HomecarePlan
	err := r.db.Preload("Patient").Preload("Doctor").First(&plan, id).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *HomecarePlanRepository) GetCarePlansByTitle(title string) (*entity.HomecarePlan, error) {
	var plan entity.HomecarePlan
	err := r.db.Preload("Patient").Preload("Doctor").Where("title = ?", title).First(&plan).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *HomecarePlanRepository) GetCarePlansByDoctor(doctorID uint) ([]*entity.HomecarePlan, error) {
	var plans []*entity.HomecarePlan
	err := r.db.Preload("Patient").Preload("Doctor").Where("doctor_id = ?", doctorID).Find(&plans).Error
	if err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *HomecarePlanRepository) GetCarePlansByUser(userID uint) ([]*entity.HomecarePlan, error) {
	var plans []*entity.HomecarePlan
	err := r.db.Preload("Patient").Preload("Doctor").Where("patient_id = ?", userID).Find(&plans).Error
	if err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *HomecarePlanRepository) UpdateCarePlan(plan *entity.HomecarePlan) (*entity.HomecarePlan, error) {
	err := r.db.Save(plan).Error
	if err != nil {
		return nil, err
	}
	// Preload relationships
	err = r.db.Preload("Patient").Preload("Doctor").First(plan, plan.ID).Error
	if err != nil {
		return nil, err
	}
	return plan, nil
}

func (r *HomecarePlanRepository) DeleteCarePlan(id uint) error {
	var plan entity.HomecarePlan
	err := r.db.Delete(&plan, id).Error
	if err != nil {
		return err
	}
	return nil
}

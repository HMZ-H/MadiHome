package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"gorm.io/gorm"
)

type HomecareVisitRepository struct {
	db *gorm.DB
}

func NewHomecareVisitRepository(db *gorm.DB) repository.HomecareVisitRepository {
	return &HomecareVisitRepository{db: db}
}

// HomecareVisit methods
func (r *HomecareVisitRepository) CreateHomecareVisit(visit *entity.HomecareVisit) (*entity.HomecareVisit, error) {
	err := r.db.Create(visit).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}
	return visit, nil
}

func (r *HomecareVisitRepository) GetHomecareVisitByID(id uint) (*entity.HomecareVisit, error) {
	var visit entity.HomecareVisit
	err := r.db.Preload("Patient").Preload("Doctor").Preload("Service").First(&visit, id).Error
	if err != nil {
		return nil, err
	}
	return &visit, nil
}

func (r *HomecareVisitRepository) GetHomecareVisitsBySeviceID(ServiceID uint) (*entity.HomecareVisit, error) {
	var visit entity.HomecareVisit
	err := r.db.Preload("Patient").Preload("Doctor").Preload("Service").Where("service_id = ?", ServiceID).First(&visit).Error
	if err != nil {
		return nil, err
	}
	return &visit, nil
}

func (r *HomecareVisitRepository) GetHomecareVisitsByUserID(userID uint) (*entity.HomecareVisit, error) {
	var visits *entity.HomecareVisit
	err := r.db.Preload("Patient").Preload("Service").Where("doctor_id = ?", userID).Find(&visits).Error
	if err != nil {
		return nil, err
	}
	return visits, nil
}

func (r *HomecareVisitRepository) GetHomecareVisitsByDoctorID(doctorID uint) ([]*entity.HomecareVisit, error) {
	var visits []*entity.HomecareVisit
	err := r.db.Preload("Patient").Preload("Service").Where("doctor_id = ?", doctorID).Find(&visits).Error
	if err != nil {
		return nil, err
	}
	return visits, nil
}

// func (r *HomecareVisitRepository) GetHomecareVisitsByUser(userID uint) ([]*entity.HomecareVisit, error) {
// 	var visits []*entity.HomecareVisit
// 	err := r.db.Preload("Doctor").Preload("Service").Where("patient_id = ?", userID).Find(&visits).Error
// 	if err != nil {
// 		return nil, err
// 	}
// 	return visits, nil
// }

func (r *HomecareVisitRepository) UpdateHomecareVisit(visit *entity.HomecareVisit) (*entity.HomecareVisit, error) {
	err := r.db.Save(visit).Error
	if err != nil {
		return nil, err
	}
	return visit, nil
}

func (r *HomecareVisitRepository) DeleteHomecareVisit(id uint) error {
	var visit entity.HomecareVisit
	err := r.db.Delete(&visit, id).Error
	if err != nil {
		return err
	}
	return nil
}

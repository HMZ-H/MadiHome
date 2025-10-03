package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"gorm.io/gorm"
)

type HomecareServiceRepository struct {
	db *gorm.DB
}

func NewHomecareServiceRepository(db *gorm.DB) repository.HomecareServiceRepository {
	return &HomecareServiceRepository{db: db}
}

// HomecareService methods
func (r *HomecareServiceRepository) CreateHomecareService(service *entity.HomecareService) (*entity.HomecareService, error) {
	err := r.db.Create(service).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}
	return service, nil
}

func (r *HomecareServiceRepository) GetHomecareServiceByID(id uint) (*entity.HomecareService, error) {
	var service entity.HomecareService
	err := r.db.First(&service, id).Error
	if err != nil {
		return nil, err
	}
	return &service, nil
}
func (r *HomecareServiceRepository) GetHomecareServiceByName(name string) (*entity.HomecareService, error) {
	var service entity.HomecareService
	err := r.db.Where("name = ?", name).First(&service).Error
	if err != nil {
		return nil, err
	}
	return &service, nil
}

func (r *HomecareServiceRepository) GetHomecareServicesByDoctor(doctorID uint) ([]*entity.HomecareService, error) {
	var services []*entity.HomecareService
	err := r.db.Where("doctor_id = ?", doctorID).Find(&services).Error
	if err != nil {
		return nil, err
	}
	return services, nil
}

func (r *HomecareServiceRepository) GetAllHomecareServices() ([]*entity.HomecareService, error) {
	var services []*entity.HomecareService
	err := r.db.Find(&services).Error
	if err != nil {
		return nil, err
	}
	return services, nil
}

func (r *HomecareServiceRepository) UpdateHomecareService(service *entity.HomecareService) (*entity.HomecareService, error) {
	err := r.db.Save(service).Error
	if err != nil {
		return nil, err
	}
	return service, nil
}

func (r *HomecareServiceRepository) DeleteHomecareService(id uint) error {
	var service entity.HomecareService
	err := r.db.Delete(&service, id).Error
	if err != nil {
		return err
	}
	return nil
}

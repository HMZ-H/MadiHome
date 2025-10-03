package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type HomecareServiceRepository interface {
	// HomecareService methods
	CreateHomecareService(service *entity.HomecareService) (*entity.HomecareService, error)
	GetHomecareServiceByID(id uint) (*entity.HomecareService, error)
	GetHomecareServiceByName(name string) (*entity.HomecareService, error)
	GetHomecareServicesByDoctor(doctorID uint) ([]*entity.HomecareService, error)
	GetAllHomecareServices() ([]*entity.HomecareService, error)
	UpdateHomecareService(service *entity.HomecareService) (*entity.HomecareService, error)
	DeleteHomecareService(id uint) error
}

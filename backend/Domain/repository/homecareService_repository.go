package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type HomecareServiceRepository interface {
	CreateHomecareService(service *entity.HomecareService) (*entity.HomecareService, error)
	GetHomecareServiceByID(id uint) (*entity.HomecareService, error)
	GetHomecareServiceByName(name string) (*entity.HomecareService, error)
	GetHomecareServicesByDoctor(doctorID uint) ([]*entity.HomecareService, error)
	GetAllHomecareServices() ([]*entity.HomecareService, error)
	SearchServices(search, category string, minPrice, maxPrice *float64, isActive *bool, sortBy, order string, offset, limit int) ([]*entity.HomecareService, int64, error)
	UpdateHomecareService(service *entity.HomecareService) (*entity.HomecareService, error)
	DeleteHomecareService(id uint) error
}

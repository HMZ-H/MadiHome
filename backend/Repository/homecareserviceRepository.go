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

func (r *HomecareServiceRepository) SearchServices(search, category string, minPrice, maxPrice *float64, isActive *bool, sortBy, order string, offset, limit int) ([]*entity.HomecareService, int64, error) {
	var services []*entity.HomecareService
	var total int64

	query := r.db.Model(&entity.HomecareService{})

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ?", like, like)
	}
	if category != "" {
		query = query.Where("category ILIKE ?", "%"+category+"%")
	}
	if minPrice != nil {
		query = query.Where("price >= ?", *minPrice)
	}
	if maxPrice != nil {
		query = query.Where("price <= ?", *maxPrice)
	}
	if isActive != nil {
		query = query.Where("is_active = ?", *isActive)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch sortBy {
	case "price":
		query = query.Order("price " + order)
	case "name":
		query = query.Order("name " + order)
	case "duration":
		query = query.Order("duration " + order)
	default:
		query = query.Order("id " + order)
	}

	if err := query.Offset(offset).Limit(limit).Find(&services).Error; err != nil {
		return nil, 0, err
	}
	return services, total, nil
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

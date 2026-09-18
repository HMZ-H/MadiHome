package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"gorm.io/gorm"
)

type RoleRequestRepository struct {
	db *gorm.DB
}

func NewRoleRequestRepository(db *gorm.DB) repository.RoleRequestRepository {
	return &RoleRequestRepository{db: db}
}

func (r *RoleRequestRepository) CreateRoleRequest(request *entity.RoleRequest) (*entity.RoleRequest, error) {
	err := r.db.Create(request).Error
	if err != nil {
		return nil, err
	}
	// Preload relationships
	err = r.db.Preload("User").Preload("Reviewer").First(request, request.ID).Error
	if err != nil {
		return nil, err
	}
	return request, nil
}

func (r *RoleRequestRepository) GetRoleRequestByID(id uint) (*entity.RoleRequest, error) {
	var request entity.RoleRequest
	err := r.db.Preload("User").Preload("Reviewer").First(&request, id).Error
	if err != nil {
		return nil, err
	}
	return &request, nil
}

func (r *RoleRequestRepository) GetRoleRequestsByUserID(userID uint) ([]*entity.RoleRequest, error) {
	var requests []*entity.RoleRequest
	err := r.db.Preload("User").Preload("Reviewer").Where("user_id = ?", userID).Find(&requests).Error
	if err != nil {
		return nil, err
	}
	return requests, nil
}

func (r *RoleRequestRepository) GetRoleRequestsByStatus(status string) ([]*entity.RoleRequest, error) {
	var requests []*entity.RoleRequest
	err := r.db.Preload("User").Preload("Reviewer").Where("status = ?", status).Find(&requests).Error
	if err != nil {
		return nil, err
	}
	return requests, nil
}

func (r *RoleRequestRepository) GetAllRoleRequests() ([]*entity.RoleRequest, error) {
	var requests []*entity.RoleRequest
	err := r.db.Preload("User").Preload("Reviewer").Find(&requests).Error
	if err != nil {
		return nil, err
	}
	return requests, nil
}

func (r *RoleRequestRepository) UpdateRoleRequest(request *entity.RoleRequest) (*entity.RoleRequest, error) {
	err := r.db.Save(request).Error
	if err != nil {
		return nil, err
	}
	// Preload relationships after update
	err = r.db.Preload("User").Preload("Reviewer").First(request, request.ID).Error
	if err != nil {
		return nil, err
	}
	return request, nil
}

func (r *RoleRequestRepository) DeleteRoleRequest(id uint) error {
	return r.db.Delete(&entity.RoleRequest{}, id).Error
}

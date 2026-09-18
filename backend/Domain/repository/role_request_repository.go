package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type RoleRequestRepository interface {
	CreateRoleRequest(request *entity.RoleRequest) (*entity.RoleRequest, error)
	GetRoleRequestByID(id uint) (*entity.RoleRequest, error)
	GetRoleRequestsByUserID(userID uint) ([]*entity.RoleRequest, error)
	GetRoleRequestsByStatus(status string) ([]*entity.RoleRequest, error)
	GetAllRoleRequests() ([]*entity.RoleRequest, error)
	UpdateRoleRequest(request *entity.RoleRequest) (*entity.RoleRequest, error)
	DeleteRoleRequest(id uint) error
}

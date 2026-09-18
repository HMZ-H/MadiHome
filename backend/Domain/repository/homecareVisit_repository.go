package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type HomecareVisitRepository interface {

	// HomecareVisit methods
	CreateHomecareVisit(visit *entity.HomecareVisit) (*entity.HomecareVisit, error)
	GetHomecareVisitByID(id uint) (*entity.HomecareVisit, error)
	GetHomecareVisitsBySeviceID(ServiceID uint) (*entity.HomecareVisit, error)
	GetHomecareVisitsByUserID(userID uint) (*entity.HomecareVisit, error)
	GetHomecareVisitsByDoctorID(doctorID uint) ([]*entity.HomecareVisit, error)
	UpdateHomecareVisit(visit *entity.HomecareVisit) (*entity.HomecareVisit, error)
	DeleteHomecareVisit(id uint) error
}

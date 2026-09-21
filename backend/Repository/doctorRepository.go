package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"gorm.io/gorm"
)

type DoctorRepository struct {
	db *gorm.DB
}

func NewDoctorRepository(db *gorm.DB) repository.DoctorRepository {
	return &DoctorRepository{db: db}
}

func (r *DoctorRepository) CreateDoctor(doctor *entity.Doctor) (*entity.Doctor, error) {
	err := r.db.Create(doctor).Error
	if err != nil {
		return nil, err
	}
	// Preload user relationship
	err = r.db.Preload("User").First(doctor, doctor.ID).Error
	if err != nil {
		return nil, err
	}
	return doctor, nil
}

func (r *DoctorRepository) GetDoctorByID(id uint) (*entity.Doctor, error) {
	var doctor entity.Doctor
	err := r.db.Preload("User").First(&doctor, id).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

func (r *DoctorRepository) GetDoctorByUserID(userID uint) (*entity.Doctor, error) {
	var doctor entity.Doctor
	err := r.db.Preload("User").Where("user_id = ?", userID).First(&doctor).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

func (r *DoctorRepository) GetDoctorByEmail(email string) (*entity.Doctor, error) {
	var doctor entity.Doctor
	err := r.db.Preload("User").Joins("JOIN users ON users.id = doctors.user_id").Where("users.email = ?", email).First(&doctor).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

func (r *DoctorRepository) GetAllDoctors() ([]*entity.Doctor, error) {
	var doctors []*entity.Doctor
	err := r.db.Preload("User").Find(&doctors).Error
	if err != nil {
		return nil, err
	}
	return doctors, nil
}

func (r *DoctorRepository) SearchDoctors(search, specialization, sortBy, order string, offset, limit int) ([]*entity.Doctor, int64, error) {
	var doctors []*entity.Doctor
	var total int64

	query := r.db.Model(&entity.Doctor{}).Preload("User")

	if search != "" {
		like := "%" + search + "%"
		query = query.Joins("JOIN users ON users.id = doctors.user_id").
			Where("users.first_name ILIKE ? OR users.last_name ILIKE ? OR doctors.specialization ILIKE ? OR doctors.bio ILIKE ?",
				like, like, like, like)
	}

	if specialization != "" {
		query = query.Where("doctors.specialization ILIKE ?", "%"+specialization+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch sortBy {
	case "experience":
		query = query.Order("doctors.experience_years " + order)
	case "name":
		if search == "" {
			query = query.Joins("JOIN users ON users.id = doctors.user_id")
		}
		query = query.Order("users.first_name " + order)
	default:
		query = query.Order("doctors.id " + order)
	}

	if err := query.Offset(offset).Limit(limit).Find(&doctors).Error; err != nil {
		return nil, 0, err
	}
	return doctors, total, nil
}

func (r *DoctorRepository) UpdateDoctor(doctor *entity.Doctor) (*entity.Doctor, error) {
	err := r.db.Save(doctor).Error
	if err != nil {
		return nil, err
	}
	// Preload user relationship
	err = r.db.Preload("User").First(doctor, doctor.ID).Error
	if err != nil {
		return nil, err
	}
	return doctor, nil
}

func (r *DoctorRepository) DeleteDoctor(id uint) error {
	var doctor entity.Doctor
	err := r.db.Delete(&doctor, id).Error
	if err != nil {
		return err
	}
	return nil
}

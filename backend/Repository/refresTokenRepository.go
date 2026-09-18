package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"gorm.io/gorm"
)

type refreshTokenRepository struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) *refreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func (r *refreshTokenRepository) Save(token *entity.RefreshToken) error {
	return r.db.Create(token).Error
}

func (r *refreshTokenRepository) FindByToken(token string) (*entity.RefreshToken, error) {
	var refreshToken entity.RefreshToken
	err := r.db.Where("token = ?", token).First(&refreshToken).Error
	return &refreshToken, err
}

func (r *refreshTokenRepository) Delete(token string) error {
	return r.db.Where("token = ?", token).Delete(&entity.RefreshToken{}).Error
}

func (r *refreshTokenRepository) DeleteByUserID(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&entity.RefreshToken{}).Error
}

package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type RefreshTokenRepository interface {
	Create(token *entity.RefreshToken) error
	FindByToken(token string) (*entity.RefreshToken, error)
	DeleteByToken(token string) error
	DeleteByUserID(userID uint) error
}

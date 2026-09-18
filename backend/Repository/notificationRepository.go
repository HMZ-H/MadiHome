package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"gorm.io/gorm"
)

type NotificationRepositoryImpl struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) repository.NotificationRepository {
	return &NotificationRepositoryImpl{db: db}
}

func (r *NotificationRepositoryImpl) CreateNotification(notification *entity.Notification) (*entity.Notification, error) {
	if err := r.db.Create(notification).Error; err != nil {
		return nil, err
	}
	return notification, nil
}

func (r *NotificationRepositoryImpl) GetNotificationsByUserID(userID uint) ([]*entity.Notification, error) {
	var notifications []*entity.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications).Error
	return notifications, err
}

func (r *NotificationRepositoryImpl) GetUnreadNotificationsByUserID(userID uint) ([]*entity.Notification, error) {
	var notifications []*entity.Notification
	err := r.db.Where("user_id = ? AND is_read = ?", userID, false).Order("created_at DESC").Find(&notifications).Error
	return notifications, err
}

func (r *NotificationRepositoryImpl) MarkNotificationAsRead(notificationID uint) error {
	return r.db.Model(&entity.Notification{}).Where("id = ?", notificationID).Update("is_read", true).Error
}

func (r *NotificationRepositoryImpl) MarkAllNotificationsAsRead(userID uint) error {
	return r.db.Model(&entity.Notification{}).Where("user_id = ?", userID).Update("is_read", true).Error
}

func (r *NotificationRepositoryImpl) DeleteNotification(notificationID uint) error {
	return r.db.Delete(&entity.Notification{}, notificationID).Error
}

func (r *NotificationRepositoryImpl) GetNotificationByID(notificationID uint) (*entity.Notification, error) {
	var notification entity.Notification
	err := r.db.First(&notification, notificationID).Error
	return &notification, err
}

package migrations

import (
	"log"

	"github.com/HMZ-H/Madihome/Domain/entity"
	"gorm.io/gorm"
)

// FixUserRoles updates existing users with empty roles
func FixUserRoles(db *gorm.DB) error {
	log.Println("Running user roles migration...")

	// Update users with empty or NULL roles to 'user'
	result := db.Model(&entity.User{}).Where("role IS NULL OR role = ''").Update("role", "user")
	if result.Error != nil {
		return result.Error
	}
	log.Printf("Updated %d users to 'user' role", result.RowsAffected)

	// Update users who are doctors to have 'doctor' role
	result = db.Model(&entity.User{}).Where("id IN (SELECT user_id FROM doctors WHERE user_id IS NOT NULL)").Update("role", "doctor")
	if result.Error != nil {
		return result.Error
	}
	log.Printf("Updated %d users to 'doctor' role", result.RowsAffected)

	log.Println("User roles migration completed successfully")
	return nil
}

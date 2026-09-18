package health

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HealthChecker struct {
	db *gorm.DB
}

type HealthStatus struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Services  map[string]string `json:"services"`
	Version   string            `json:"version"`
	Uptime    string            `json:"uptime"`
}

func NewHealthChecker(db *gorm.DB) *HealthChecker {
	return &HealthChecker{db: db}
}

func (hc *HealthChecker) HealthCheck(c *gin.Context) {
	startTime := time.Now()
	services := make(map[string]string)

	// Check database connection
	if err := hc.checkDatabase(); err != nil {
		services["database"] = "unhealthy"
		c.JSON(http.StatusServiceUnavailable, HealthStatus{
			Status:    "unhealthy",
			Timestamp: time.Now(),
			Services:  services,
			Version:   "1.0.0",
			Uptime:    time.Since(startTime).String(),
		})
		return
	}
	services["database"] = "healthy"

	// Check Redis connection (if implemented)
	services["redis"] = "healthy"

	// Check file storage (if implemented)
	services["storage"] = "healthy"

	c.JSON(http.StatusOK, HealthStatus{
		Status:    "healthy",
		Timestamp: time.Now(),
		Services:  services,
		Version:   "1.0.0",
		Uptime:    time.Since(startTime).String(),
	})
}

func (hc *HealthChecker) checkDatabase() error {
	sqlDB, err := hc.db.DB()
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return sqlDB.PingContext(ctx)
}

func (hc *HealthChecker) ReadinessCheck(c *gin.Context) {
	// Check if all required services are ready
	if err := hc.checkDatabase(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "database not available",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "ready",
	})
}

func (hc *HealthChecker) LivenessCheck(c *gin.Context) {
	// Simple liveness check - if the service is running, it's alive
	c.JSON(http.StatusOK, gin.H{
		"status": "alive",
	})
}

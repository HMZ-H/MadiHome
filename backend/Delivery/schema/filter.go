package schema

type ListFilter struct {
	Search   string `form:"search"`
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	SortBy   string `form:"sort_by"`
	Order    string `form:"order"`
}

type DoctorFilter struct {
	ListFilter
	Specialization string `form:"specialization"`
}

type ServiceFilter struct {
	ListFilter
	Category string `form:"category"`
	MinPrice *float64 `form:"min_price"`
	MaxPrice *float64 `form:"max_price"`
	IsActive *bool    `form:"is_active"`
}

type PaginatedResponse struct {
	Success  bool        `json:"success"`
	Message  string      `json:"message"`
	Data     interface{} `json:"data"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
	Total    int64       `json:"total"`
}

func (f *ListFilter) Normalize() {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PageSize < 1 || f.PageSize > 100 {
		f.PageSize = 20
	}
	if f.Order != "asc" && f.Order != "desc" {
		f.Order = "asc"
	}
}

func (f *ListFilter) Offset() int {
	return (f.Page - 1) * f.PageSize
}

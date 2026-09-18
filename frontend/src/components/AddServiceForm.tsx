import React, {useState, useEffect} from "react";


export interface Service {
    id: number;
    doctor_id?: number | null;
    name: string;
    description?: string;
    duration: number;
    price: number;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface AddServiceFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (service: Service) => void;
    editMode?: boolean;
    existingService?: Service;
  }
  
  interface ServiceFormData {
    name: string;
    description: string;
    duration: number | ''; // allow empty while typing
    price: number | '';
    category: string;
  }
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  
  export default function AddServiceForm({
    isOpen,
    onClose,
    onSuccess,
    editMode = false,
    existingService,
  }: AddServiceFormProps) {
    const [formData, setFormData] = useState<ServiceFormData>({
      name: '',
      description: '',
      duration: '',
      price: '',
      category: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editMode && existingService) {
            setFormData({
                name: existingService.name || '',
                description: existingService.description || '',
                // Using nullish coalescing (??) here to distinguish 0 from null/undefined,
                // defaulting to '' if null/undefined.
                duration: existingService.duration ?? '',
                price: existingService.price ?? '',
                category: existingService.category || '',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                duration: '',
                price: '',
                category: '',
            });
        }
    }, [editMode, existingService, isOpen]);

    if (!isOpen)  return null;
    

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
          ...prev,
          // coerce number fields
          [name]:
            name === 'duration' || name === 'price'
              ? value === '' ? '' : Number(value)
              : value,
        }));
      };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // basic validation 
        if (!formData.name || !formData.duration || !formData.price || !formData.category) {
            setError('Please fill all required fields');
            return;
        }

        try {
            setSubmitting(true);

            const token = localStorage.getItem('access_token');
            const url = editMode && existingService
                ? `${API_BASE_URL}/api/doctor/services/${existingService.id}`
                : `${API_BASE_URL}/api/doctor/services`;
            const method = editMode ? 'PUT' : 'POST';

            const requestData = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token} || ''`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    duration: formData.duration,
                    price: formData.price,
                    category: formData.category,
                }),
            });
            
            const data = await requestData.json();
            if (!requestData.ok) {
                throw new Error(data?.message || 'Failed to add service');
            }

            onSuccess?.(data.data || data);
            onClose();
        } catch (error) {
            setError(error instanceof Error ? error.message: 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-500 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {editMode ? 'Update Service': 'Add New Service'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-700 border border-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Service Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name*
                        </label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg fcvus:ring-2 focus:ring-primary focus:border-transparent"
                            // placeholder="Home "
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Brief description of the service"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
                            <input 
                                type="number"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                min={1}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="60"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min={0}
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="49.99"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <select 
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="" >Select category</option>
                            <option value="home_consultation">Home Consultation</option>
                            <option value="nursing">Nursing</option>
                            <option value="physiotherapy">Physiotherapy</option>
                            <option value="post_surgery">Post-surgery Care</option>
                            <option value="elder_care">Elder Care</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="flex  justify-end gap-3 pt-2">
                        <button
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            onClick={onClose}
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                            >
                            {submitting ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update' : 'Add Service')}
                        </button>
                    </div>
                </form>

            </div>


        </div>
    )
    
}
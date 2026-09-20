import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { uploadPhoto } from "../utils/photoUpload";
import { getAcceptString } from "../utils/fileValidation";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  gender: string;
  birthday: string;
  address: string;
  photo: string;
  is_verified: boolean;
  created_at: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    birthday: '',
    address: '',
    photo: ''
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    
    // Simple check for user data
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
          first_name: parsedUser.first_name || '',
          last_name: parsedUser.last_name || '',
          email: parsedUser.email || '',
          phone: parsedUser.phone || '',
          gender: parsedUser.gender || '',
          birthday: parsedUser.birthday || '',
          address: parsedUser.address || '',
          photo: parsedUser.photo || ''
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    
    setIsLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setPhotoError('');

    try {
      const result = await uploadPhoto(file);
      
      if (result.success && result.url) {
        setFormData(prev => ({
          ...prev,
          photo: result.url!
        }));
        setPhotoError('');
      } else {
        setPhotoError(result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      setPhotoError('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("You are not authenticated. Please log in again.");
        window.location.href = "/login";
        return;
      }

      // Call API
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const url = `${apiBaseUrl}/api/users/${user.id}`;
      
      // Convert camelCase to snake_case for backend
      const requestData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        birthday: formData.birthday,
        address: formData.address,
        photo: formData.photo,
        role: user.role // Preserve the user's role
      };

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${response.status} - ${errorText}`);
      }
      
      const responseData = await response.json();

      // Handle the response structure - backend returns {success, message, data}
      let updatedUser;
      if (responseData.success && responseData.data) {
        updatedUser = responseData.data;
      } else {
        // Fallback: use the response directly if it's already the user object
        updatedUser = responseData;
      }

      // Update frontend state with photo and preserve role
      const updatedUserWithPhoto = { 
        ...updatedUser, 
        photo: formData.photo,
        role: user.role // Ensure role is preserved
      };
      setUser(updatedUserWithPhoto);
      localStorage.setItem('user', JSON.stringify(updatedUserWithPhoto));

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || '',
        birthday: user.birthday || '',
        address: user.address || '',
        photo: user.photo || ''
      });
    }
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      alert('Please enter your password to confirm account deletion');
      return;
    }

    setIsDeleting(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("You are not authenticated. Please log in again.");
        window.location.href = "/login";
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const deleteUrl = `${apiBaseUrl}/api/user/account`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password: deletePassword
        })
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (_textError) {
            // response body already consumed
          }
        }
        throw new Error(errorMessage);
      }

      // Clear all local storage and redirect to home
      localStorage.clear();
      alert('Your account has been deleted successfully.');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(`Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Logged In</h1>
          <p className="text-gray-600 mb-6">Please log in to view your profile.</p>
          <Link 
            to="/login" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const isDoctor = user.role === 'doctor';

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-white text-gray-800 px-4 py-2 flex justify-between items-center shadow-lg w-full sticky top-0 z-50 border-b border-gray-200">
        <Link to="/">
          <Logo size="md" variant="full" />
        </Link>
        
        <div className="flex gap-4 items-center">
          <Link 
            to={isDoctor ? "/doctor-dashboard" : "/patient-dashboard"}
            className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
          >
            {isDoctor ? "Doctor Dashboard" : "My Dashboard"}
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:shadow-2xl transition-all duration-300 interactive-card">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {isDoctor ? "Doctor Profile" : "My Profile"}
              </h1>
              <p className="text-gray-600">
                {isDoctor ? "Manage your professional information" : "Manage your personal information"}
              </p>
            </div>
            
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Picture & Basic Info */}
            <div className="lg:col-span-1">
              <div className="text-center bg-gray-50 rounded-lg p-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  {(isEditing ? formData.photo : user.photo) ? (
                    <img 
                      src={isEditing ? formData.photo : user.photo} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                    </div>
                  )}
                  
                  {isEditing && (
                    <label className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-2 cursor-pointer hover:bg-emerald-700 transition-colors shadow-lg">
                      <input
                        type="file"
                        accept={getAcceptString('image')}
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={isUploadingPhoto}
                      />
                      {isUploadingPhoto ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </label>
                  )}
                </div>
                
                {photoError && (
                  <div className="text-red-600 text-sm mb-2">{photoError}</div>
                )}
                
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-gray-600 capitalize mb-3">
                  {isDoctor ? "Dr." : "Patient"}
                </p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.is_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.is_verified ? 'Verified' : 'Pending Verification'}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Personal Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{user.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{user.last_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{user.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{user.phone}</p>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Additional Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 py-2">{user.gender}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Birthday
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{user.birthday}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{user.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Role-specific Information */}
              {isDoctor && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Doctor Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specialization
                      </label>
                      <p className="text-gray-900">Homecare Medicine</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Number
                      </label>
                      <p className="text-gray-900">MD-{user.id.toString().padStart(6, '0')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Experience
                      </label>
                      <p className="text-gray-900">5+ Years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Area
                      </label>
                      <p className="text-gray-900">Addis Ababa</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Status
                    </label>
                    <p className="text-gray-900">
                      {user.is_verified ? 'Active' : 'Pending Verification'}
                    </p>
                  </div>
                </div>
                
                {/* Danger Zone */}
                <div className="mt-6 pt-6 border-t border-red-200">
                  <h4 className="text-lg font-semibold text-red-600 mb-3">
                    Danger Zone
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Account
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-4">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Your password"
                  disabled={isDeleting}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors flex items-center"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

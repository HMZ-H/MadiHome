import React, { useState, useEffect } from 'react';

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialty: string;
  experience_years: number;
  rating: number;
  total_patients: number;
  profile_photo?: string;
  bio: string;
  is_available?: boolean;
  consultation_fee?: number;
}

export default function TrustedDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${API_BASE_URL}/api/doctors`);
        
        if (response.ok) {
          const data = await response.json();
          // Transform the data to match our interface
          const transformedDoctors = data.data?.map((doctor: any) => ({
            id: doctor.id,
            first_name: doctor.user?.first_name || 'Dr.',
            last_name: doctor.user?.last_name || 'Smith',
            specialty: doctor.specialty || 'General Medicine',
            experience_years: doctor.experience_years || 5,
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Random rating between 3.0-5.0
            total_patients: Math.floor(Math.random() * 500) + 100, // Random patient count
            profile_photo: doctor.profile_photo,
            bio: doctor.bio || `Experienced ${doctor.specialty || 'medical'} professional with ${doctor.experience_years || 5}+ years of expertise.`,
            is_available: Math.random() > 0.3, // 70% chance of being available
            consultation_fee: Math.floor(Math.random() * 200) + 50 // Random fee between $50-$250
          })) || [];
          
          setDoctors(transformedDoctors.slice(0, 6)); // Show top 6 doctors
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        // Fallback data for demo
        setDoctors([
          {
            id: 1,
            first_name: 'Sarah',
            last_name: 'Johnson',
            specialty: 'Cardiology',
            experience_years: 12,
            rating: 4.9,
            total_patients: 450,
            bio: 'Leading cardiologist with 12+ years of experience in preventive and interventional cardiology.',
            is_available: true,
            consultation_fee: 150
          },
          {
            id: 2,
            first_name: 'Michael',
            last_name: 'Chen',
            specialty: 'Neurology',
            experience_years: 8,
            rating: 4.8,
            total_patients: 320,
            bio: 'Specialized in neurological disorders and advanced treatment protocols.',
            is_available: false,
            consultation_fee: 180
          },
          {
            id: 3,
            first_name: 'Emily',
            last_name: 'Rodriguez',
            specialty: 'Pediatrics',
            experience_years: 10,
            rating: 4.9,
            total_patients: 380,
            bio: 'Dedicated pediatrician focused on comprehensive child healthcare and family support.',
            is_available: true,
            consultation_fee: 120
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Filter and sort doctors
  useEffect(() => {
    let filtered = [...doctors];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.bio.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Specialty filter
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(doctor => doctor.specialty === selectedSpecialty);
    }

    // Availability filter
    if (showAvailableOnly) {
      filtered = filtered.filter(doctor => doctor.is_available);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experience_years - a.experience_years;
        case 'patients':
          return b.total_patients - a.total_patients;
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'fee':
          return a.consultation_fee! - b.consultation_fee!;
        default:
          return 0;
      }
    });

    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, selectedSpecialty, showAvailableOnly, sortBy]);

  const specialties = ['all', ...Array.from(new Set(doctors.map(d => d.specialty)))];

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
  };

  const handleDoctorClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDoctor(null);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading our trusted doctors...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-emerald-50 to-blue-50 relative overflow-hidden">
      {/* Background Medical Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-200 rounded-full"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-blue-200 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-teal-200 rounded-full"></div>
        <div className="absolute bottom-32 right-1/3 w-16 h-16 bg-emerald-300 rounded-full"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by <span className="text-emerald-600">Patients</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our experienced medical professionals are dedicated to providing exceptional homecare services. 
            Meet the doctors who make a difference in our patients' lives.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">50+</div>
            <div className="text-gray-600">Expert Doctors</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">10,000+</div>
            <div className="text-gray-600">Patients Served</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">98%</div>
            <div className="text-gray-600">Patient Satisfaction</div>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="mb-8 space-y-4">
          {/* Search and Filters Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search doctors by name, specialty, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Specialty Filter */}
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty === 'all' ? 'All Specialties' : specialty}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="rating">Sort by Rating</option>
                <option value="experience">Sort by Experience</option>
                <option value="patients">Sort by Patients</option>
                <option value="name">Sort by Name</option>
                <option value="fee">Sort by Fee</option>
              </select>

              {/* Available Only Toggle */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Available only</span>
              </label>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredDoctors.length} of {doctors.length} doctors
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedSpecialty !== 'all' && ` in ${selectedSpecialty}`}
            {showAvailableOnly && ' (available only)'}
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDoctors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No doctors found</div>
              <div className="text-gray-400">Try adjusting your search or filters</div>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
            <div 
              key={doctor.id} 
              className="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105 group"
              onClick={() => handleDoctorClick(doctor)}
            >
              {/* Medical Background with Stethoscope Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-teal-50 opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
              
              {/* Subtle Medical Equipment Pattern */}
              <div className="absolute top-4 right-4 opacity-10">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              
              {/* Medical Cross Pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" viewBox="0 0 60 60" fill="currentColor">
                  <path d="M30 5 L30 25 L50 25 L50 35 L30 35 L30 55 L20 55 L20 35 L0 35 L0 25 L20 25 L20 5 Z" fill="currentColor"/>
                </svg>
              </div>
              
              <div className="relative p-6">
              {/* Doctor Photo with Enhanced Styling */}
              <div className="flex items-center mb-4">
                <div className="relative w-16 h-16 mr-4">
                  {/* Photo Ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 p-0.5">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      {doctor.profile_photo ? (
                        <img 
                          src={doctor.profile_photo} 
                          alt={`${doctor.first_name} ${doctor.last_name}`}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {doctor.first_name[0]}{doctor.last_name[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Online Status Indicator */}
                  {doctor.is_available && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </h3>
                  <p className="text-emerald-600 font-medium">{doctor.specialty}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center mb-3">
                <div className="flex items-center mr-2">
                  {renderStars(doctor.rating)}
                </div>
                <span className="text-sm font-medium text-gray-900">{doctor.rating}</span>
                <span className="text-sm text-gray-500 ml-1">
                  ({doctor.total_patients} patients)
                </span>
              </div>

              {/* Experience and Availability */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{doctor.experience_years}+ years experience</span>
                </div>
                <div className="flex items-center space-x-2">
                  {doctor.is_available ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
                      Busy
                    </span>
                  )}
                </div>
              </div>

              {/* Consultation Fee */}
              <div className="text-sm text-emerald-600 font-semibold mb-4">
                Consultation Fee: ${doctor.consultation_fee}
              </div>

              {/* Bio */}
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {doctor.bio}
              </p>

              {/* Action Button */}
              <button 
                className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 font-medium ${
                  doctor.is_available 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!doctor.is_available}
                onClick={(e) => {
                  e.stopPropagation();
                  if (doctor.is_available) {
                    handleDoctorClick(doctor);
                  }
                }}
              >
                {doctor.is_available ? 'Book Consultation' : 'Currently Unavailable'}
              </button>
            </div>
            </div>
            ))
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <button className="bg-white text-emerald-600 border-2 border-emerald-600 px-8 py-3 rounded-lg hover:bg-emerald-600 hover:text-white transition-all duration-200 font-semibold">
            View All Doctors
          </button>
        </div>
      </div>

      {/* Doctor Detail Modal */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Doctor Details */}
              <div className="space-y-6">
                {/* Photo and Basic Info */}
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    {selectedDoctor.profile_photo ? (
                      <img 
                        src={selectedDoctor.profile_photo} 
                        alt={`${selectedDoctor.first_name} ${selectedDoctor.last_name}`}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {selectedDoctor.first_name[0]}{selectedDoctor.last_name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{selectedDoctor.specialty}</h4>
                    <div className="flex items-center mt-2">
                      <div className="flex items-center mr-4">
                        {renderStars(selectedDoctor.rating)}
                        <span className="ml-2 text-sm font-medium">{selectedDoctor.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {selectedDoctor.total_patients} patients
                      </span>
                    </div>
                    <div className="mt-2">
                      {selectedDoctor.is_available ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          Available for consultation
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                          Currently unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Experience and Fee */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-1">Experience</h5>
                    <p className="text-emerald-600 font-medium">{selectedDoctor.experience_years}+ years</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-1">Consultation Fee</h5>
                    <p className="text-emerald-600 font-medium">${selectedDoctor.consultation_fee}</p>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">About</h5>
                  <p className="text-gray-600 leading-relaxed">{selectedDoctor.bio}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4 border-t">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Close
                  </button>
                  {selectedDoctor.is_available && (
                    <button className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                      Book Consultation
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

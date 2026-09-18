import React from 'react';
import { Stethoscope, Heart, Shield, Clock, Users, Award } from 'lucide-react';

export default function MedicalFeatures() {
  const features = [
    {
      icon: Stethoscope,
      title: 'General Consultation',
      description: 'Comprehensive medical consultations in the comfort of your home'
    },
    {
      icon: Heart,
      title: 'Chronic Care Management',
      description: 'Ongoing care for diabetes, hypertension, and other chronic conditions'
    },
    {
      icon: Shield,
      title: 'Emergency Response',
      description: '24/7 emergency medical services with rapid response times'
    },
    {
      icon: Clock,
      title: 'Lab Services',
      description: 'Home sample collection and quick lab test results'
    },
    {
      icon: Users,
      title: 'Nursing Care',
      description: 'Professional nursing care for recovery and rehabilitation'
    },
    {
      icon: Award,
      title: 'Specialized Care',
      description: 'Expert care for specific medical conditions and treatments'
    }
  ];

  const stats = [
    { title: 'Patients Served', value: '2,500+', description: 'Happy families' },
    { title: 'Doctors Available', value: '50+', description: 'Certified professionals' },
    { title: 'Response Time', value: '< 30 min', description: 'Average arrival' },
    { title: 'Success Rate', value: '99%', description: 'Patient satisfaction' }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our <span className="text-emerald-600">Medical Services</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive healthcare services delivered directly to your home by 
            licensed medical professionals.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">{stat.value}</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">{stat.title}</div>
              <div className="text-sm text-gray-600">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const colors = [
              { bg: 'bg-emerald-100', text: 'text-emerald-600' },
              { bg: 'bg-blue-100', text: 'text-blue-600' },
              { bg: 'bg-purple-100', text: 'text-purple-600' },
              { bg: 'bg-orange-100', text: 'text-orange-600' },
              { bg: 'bg-pink-100', text: 'text-pink-600' },
              { bg: 'bg-indigo-100', text: 'text-indigo-600' }
            ];
            const colorClass = colors[index % colors.length];
            
            return (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                <div className={`w-16 h-16 ${colorClass.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <feature.icon className={`w-8 h-8 ${colorClass.text}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

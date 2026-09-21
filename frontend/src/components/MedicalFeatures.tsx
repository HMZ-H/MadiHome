import { Stethoscope, Heart, Shield, Clock, Users, Award } from 'lucide-react';

const features = [
  {
    icon: Stethoscope,
    title: 'General Consultation',
    description: 'Comprehensive medical consultations in the comfort of your home.',
    color: 'emerald',
  },
  {
    icon: Heart,
    title: 'Chronic Care',
    description: 'Ongoing management for diabetes, hypertension, and more.',
    color: 'rose',
  },
  {
    icon: Shield,
    title: 'Emergency Response',
    description: '24/7 emergency medical services with rapid response.',
    color: 'blue',
  },
  {
    icon: Clock,
    title: 'Lab Services',
    description: 'Home sample collection with quick turnaround results.',
    color: 'amber',
  },
  {
    icon: Users,
    title: 'Nursing Care',
    description: 'Professional nursing for recovery and rehabilitation.',
    color: 'purple',
  },
  {
    icon: Award,
    title: 'Specialized Care',
    description: 'Expert treatment for specific medical conditions.',
    color: 'teal',
  },
];

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'group-hover:border-emerald-200' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'group-hover:border-rose-200' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'group-hover:border-blue-200' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'group-hover:border-amber-200' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'group-hover:border-purple-200' },
  teal: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'group-hover:border-teal-200' },
};

const stats = [
  { value: '2,500+', label: 'Patients served' },
  { value: '50+', label: 'Licensed doctors' },
  { value: '<30 min', label: 'Avg. response' },
  { value: '99%', label: 'Satisfaction' },
];

export default function MedicalFeatures() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">
            Why choose MadiHome
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              home healthcare
            </span>
          </h2>
          <p className="text-gray-600 text-lg">
            Comprehensive medical services delivered by licensed professionals, right at your door.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const colors = colorMap[feature.color];
            return (
              <div
                key={i}
                className={`group p-6 rounded-2xl border border-gray-100 ${colors.border} bg-white hover:shadow-lg transition-all duration-300 cursor-default`}
              >
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

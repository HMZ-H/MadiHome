import { Link } from "react-router-dom";
import { Clock, ArrowRight, Check } from "lucide-react";

const services = [
  {
    name: "General Consultation",
    description: "Comprehensive medical consultation with licensed doctors at your home.",
    duration: 45,
    price: 150,
    features: ["Physical examination", "Medical history review", "Treatment plan", "Prescription"],
    popular: false,
  },
  {
    name: "Nursing Care",
    description: "Professional nursing care for recovery and chronic condition management.",
    duration: 60,
    price: 120,
    features: ["Wound care", "Medication admin", "Vital signs", "Recovery support"],
    popular: true,
  },
  {
    name: "Lab Services",
    description: "Home sample collection and laboratory testing with quick results.",
    duration: 30,
    price: 80,
    features: ["Blood collection", "Urine testing", "Quick results", "Digital reports"],
    popular: false,
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-600 text-lg">
            Choose the service that fits your needs. No hidden fees, no surprises.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {services.map((service, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                service.popular
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 md:scale-[1.03]'
                  : 'bg-white border border-gray-200 hover:border-emerald-200 hover:shadow-lg'
              }`}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-900 text-emerald-100 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                    Most popular
                  </span>
                </div>
              )}

              <h3 className={`text-xl font-bold mb-2 ${service.popular ? 'text-white' : 'text-gray-900'}`}>
                {service.name}
              </h3>
              <p className={`text-sm mb-6 ${service.popular ? 'text-emerald-100' : 'text-gray-500'}`}>
                {service.description}
              </p>

              <div className="mb-6">
                <span className={`text-4xl font-bold ${service.popular ? 'text-white' : 'text-gray-900'}`}>
                  ${service.price}
                </span>
                <span className={`text-sm ml-1 ${service.popular ? 'text-emerald-200' : 'text-gray-400'}`}>
                  /visit
                </span>
              </div>

              <div className={`flex items-center gap-2 text-sm mb-6 ${service.popular ? 'text-emerald-200' : 'text-gray-500'}`}>
                <Clock className="w-4 h-4" />
                <span>{service.duration} minutes</span>
              </div>

              <ul className="space-y-3 mb-8">
                {service.features.map((feature, fi) => (
                  <li key={fi} className="flex items-center gap-2.5 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      service.popular ? 'bg-emerald-500' : 'bg-emerald-100'
                    }`}>
                      <Check className={`w-3 h-3 ${service.popular ? 'text-white' : 'text-emerald-600'}`} />
                    </div>
                    <span className={service.popular ? 'text-emerald-50' : 'text-gray-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  service.popular
                    ? 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-sm'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-500 mb-4 text-sm">Need a custom plan for your family?</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors"
          >
            Contact us for enterprise pricing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

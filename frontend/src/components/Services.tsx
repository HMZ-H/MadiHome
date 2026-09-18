import { Link } from "react-router-dom";
import { Clock, DollarSign, ArrowRight } from "lucide-react";

const services = [
  {
    name: "General Consultation",
    description: "Comprehensive medical consultation with licensed doctors at your home",
    duration: 45,
    price: 150,
    features: ["Physical examination", "Medical history review", "Treatment plan"]
  },
  {
    name: "Nursing Care",
    description: "Professional nursing care for recovery and chronic condition management",
    duration: 60,
    price: 120,
    features: ["Wound care", "Medication administration", "Vital signs monitoring"]
  },
  {
    name: "Lab Services",
    description: "Home sample collection and laboratory testing services",
    duration: 30,
    price: 80,
    features: ["Blood collection", "Urine testing", "Quick results"]
  },
];

export default function Services() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our <span className="text-emerald-600">Services</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional medical services delivered to your doorstep with care and expertise.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.name}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                
                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Duration and Price */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{service.duration} minutes</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span className="text-2xl font-bold text-emerald-600">${service.price}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  to="/register"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center group"
                >
                  Book Service
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">Ready to get started with our homecare services?</p>
          <Link
            to="/register"
            className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}

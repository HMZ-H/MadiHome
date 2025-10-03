import React from "react";

const services = [
  {
    name: "Blood Tests",
    description: "Professional blood testing and analysis",
    duration: 45,
    price: 120.0,
    category: "diagnostic",
  },
  {
    name: "Nursing Care",
    description: "At-home nursing care for recovery",
    duration: 60,
    price: 80.0,
    category: "care",
  },
  {
    name: "Doctor Consultation",
    description: "Book a trusted doctor to visit at home",
    duration: 30,
    price: 150.0,
    category: "consultation",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-16 px-8 bg-white">
      <h3 className="text-3xl font-bold text-center mb-10">Our Services</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div key={index} className="border p-6 rounded-lg shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-2">{service.name}</h4>
            <p className="text-gray-600 mb-3">{service.description}</p>
            <p className="text-gray-800 font-medium">Duration: {service.duration} mins</p>
            <p className="text-gray-800 font-medium">Price: ${service.price}</p>
            <button className="mt-4 bg-primary text-white px-4 py-2 rounded-lg">
              Book Now
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

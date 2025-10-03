import React from "react";

export default function Hero() {
  return (
    <section className="bg-background text-center py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-5xl font-bold mb-6 text-gray-800">Quality Homecare Services at <span className="text-primary">Your Doorstep</span></h2>
        <p className="text-xl mb-8 text-gray-600 max-w-2xl mx-auto">Trusted doctors and nurses for your family's health, anytime, anywhere.</p>
        <button className="bg-primary hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
          Get Started
        </button>
      </div>
    </section>
  );
}

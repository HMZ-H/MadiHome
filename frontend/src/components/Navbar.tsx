import React from "react";
import SimpleLogo from "./SimpleLogo";

export default function Navbar() {
  return (
    <nav className="bg-white text-gray-800 px-6 py-4 flex justify-between items-center shadow-lg w-full sticky top-0 z-50 border-b border-gray-200">
      <SimpleLogo size="md" />
      <ul className="flex gap-8">
        <li><a href="#services" className="hover:text-primary transition-colors font-medium text-gray-700">Services</a></li>
        <li><a href="#about" className="hover:text-primary transition-colors font-medium text-gray-700">About</a></li>
        <li><a href="#contact" className="hover:text-primary transition-colors font-medium text-gray-700">Contact</a></li>
      </ul>
      <button className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
        Book Now
      </button>
    </nav>
  );
}

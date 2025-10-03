import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-background w-full">
      <Navbar />
      <Hero />
      <Services />
      <Footer />
    </div>
  );
}

export default App;

import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-8 mt-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo size="lg" theme="dark" />
          <div className="text-center md:text-right">
            <p className="text-accent mb-2">Quality Homecare Services</p>
            <p>&copy; {new Date().getFullYear()} MadiHome. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

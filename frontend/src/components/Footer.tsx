import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Heart } from "lucide-react";

const footerLinks = {
  Product: [
    { label: 'Services', href: '#services' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#services' },
    { label: 'Doctors', href: '#doctors' },
  ],
  Company: [
    { label: 'About us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'HIPAA', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* CTA banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -top-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Ready to get started?</h3>
            <p className="text-emerald-100 text-sm">Book your first home visit today. No commitments required.</p>
          </div>
          <Link
            to="/register"
            className="flex-shrink-0 px-8 py-3.5 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all shadow-sm"
          >
            Get started free
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Logo size="md" variant="full" theme="dark" />
            <p className="mt-4 text-sm text-gray-400 max-w-xs leading-relaxed">
              Professional healthcare services delivered to your doorstep by licensed medical professionals.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} MadiHome. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" /> for better healthcare
          </p>
        </div>
      </div>
    </footer>
  );
}

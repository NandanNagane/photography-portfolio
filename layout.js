import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { name: "Home", path: "Home" },
    { name: "About", path: "About" },
    { name: "Portfolio", path: "Portfolio" },
    { name: "Contact", path: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Navigation */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              to={createPageUrl("Home")}
              className="flex items-center gap-2 group"
            >
              <Camera className="w-6 h-6 text-gray-800 group-hover:text-gray-600 transition-colors" />
              <span className="text-xl font-light tracking-wider text-gray-800">
                SHRI<span className="font-semibold">PHOTO</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <ul className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={createPageUrl(item.path)}
                    className={`text-sm font-medium tracking-wide transition-colors relative group ${
                      location.pathname === createPageUrl(item.path)
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {item.name}
                    <span
                      className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full ${
                        location.pathname === createPageUrl(item.path)
                          ? "w-full"
                          : ""
                      }`}
                    />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-800 hover:text-gray-600 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <ul className="px-6 py-4 space-y-3">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={createPageUrl(item.path)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block text-base font-medium transition-colors ${
                        location.pathname === createPageUrl(item.path)
                          ? "text-gray-900"
                          : "text-gray-600"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              <span className="text-sm font-light tracking-wider">
                SHRI<span className="font-semibold">PHOTO</span>
              </span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; 2025 Shri Photographer. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
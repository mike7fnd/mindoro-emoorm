import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

export function Footer() {
  return (
    <footer
      className="hidden md:block w-full bg-[#f0f0ee] text-[#111] mt-10"
      role="contentinfo"
      aria-label="Footer"
    >
      {/* Main footer columns */}
      <div className="max-w-[1480px] mx-auto px-16 py-12 grid grid-cols-5 gap-10">
        {/* Brand column */}
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Image
              src="/brand-icon.png"
              alt="Emoorm"
              width={36}
              height={36}
              style={{ objectFit: "contain" }}
            />
            <span
              className="text-xl font-normal text-[#111]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Emoorm
            </span>
          </Link>
          <p className="text-sm text-[#555] leading-relaxed mb-5 max-w-[280px]">
            Your hyperlocal marketplace for fresh, authentic goods from Oriental
            Mindoro, Philippines. Supporting local farmers and producers.
          </p>
          <div className="flex items-start gap-2 text-sm text-[#555] mb-2">
            <MapPin className="h-4 w-4 text-[#29a366] shrink-0 mt-0.5" />
            <span>Oriental Mindoro, Philippines</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#555] mb-2">
            <Phone className="h-4 w-4 text-[#29a366] shrink-0" />
            <span>+63 915 193 1262</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#555] mb-5">
            <Mail className="h-4 w-4 text-[#29a366] shrink-0" />
            <span>supportemoorm@gmail.com</span>
          </div>
          <div className="flex items-center gap-3">
            {[
              { href: "#", icon: <Facebook className="h-4 w-4" /> },
              { href: "#", icon: <Instagram className="h-4 w-4" /> },
              { href: "#", icon: <Twitter className="h-4 w-4" /> },
              { href: "#", icon: <Youtube className="h-4 w-4" /> },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                className="h-8 w-8 rounded-full border border-black/15 flex items-center justify-center text-[#444] hover:border-[#29a366] hover:text-[#29a366] transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-sm font-semibold text-[#111] mb-4 ">Shop</h4>
          <ul className="space-y-2.5">
            {[
              "Vegetables",
              "Fruits",
              "Seafood",
              "Meat & Poultry",
              "Rice & Grains",
              "Snacks",
              "Delicacies",
              "Wellness",
              "Handicrafts",
            ].map((cat) => (
              <li key={cat}>
                <Link
                  href={`/?cat=${encodeURIComponent(cat)}`}
                  className="text-sm text-[#555] hover:text-[#29a366] transition-colors"
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="text-sm font-semibold text-[#111] mb-4 ">Account</h4>
          <ul className="space-y-2.5">
            {[
              { label: "My Profile", href: "/profile" },
              { label: "My Orders", href: "/my-bookings" },
              { label: "Wishlist", href: "/wishlist" },
              { label: "Notifications", href: "/notifications" },
              { label: "Messages", href: "/messages" },
              { label: "Sell on Emoorm", href: "/sell" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-[#555] hover:text-[#29a366] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="text-sm font-semibold text-[#111] mb-4 ">
            Help & Info
          </h4>
          <ul className="space-y-2.5">
            {[
              { label: "Customer Care", href: "/customer-care" },
              { label: "How to Order", href: "/how-to-order" },
              { label: "Delivery Info", href: "/delivery" },
              { label: "Returns & Refunds", href: "/returns" },
              { label: "Feedback", href: "/feedback" },
              { label: "About Emoorm", href: "/about" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-[#555] hover:text-[#29a366] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-black/10">
        <div className="max-w-[1480px] mx-auto px-16 py-5 flex items-center justify-between">
          <p className="text-xs text-[#999]">
            © {new Date().getFullYear()} Emoorm. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-[#999] hover:text-[#444] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-[#999] hover:text-[#444] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/sitemap"
              className="text-xs text-[#999] hover:text-[#444] transition-colors"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

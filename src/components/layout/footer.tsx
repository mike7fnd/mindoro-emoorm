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
      {/* SEO info block */}
      <div className="border-b border-black/[0.07]" style={{ backgroundColor: "#f7f7f5" }}>
        <div className="max-w-[1480px] mx-auto px-16 py-10">

          {/* Top three paragraphs */}
          <div className="grid grid-cols-3 gap-10 mb-8">
            <div>
              <h3 className="text-[13px] font-semibold text-[#111] mb-2.5">
                Buy and Sell Online on Emoorm
              </h3>
              <p className="text-[12px] text-[#777] leading-relaxed">
                Emoorm is the trusted hyperlocal marketplace connecting buyers with farmers, fishers, artisans, and food producers from Oriental Mindoro, Philippines. Whether you're looking for freshly harvested vegetables, locally caught seafood, handcrafted goods, or traditional Mindoreno delicacies, Emoorm brings it all to your fingertips. Join thousands of Mindoro locals who shop and sell on Emoorm every day — your gateway to the finest products the province has to offer.
              </p>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-[#111] mb-2.5">
                Shop with Confidence on Emoorm
              </h3>
              <p className="text-[12px] text-[#777] leading-relaxed">
                Shopping on Emoorm is safe, straightforward, and rewarding. Every seller on our platform is verified to ensure you're buying from trusted local producers. Browse shop ratings and customer reviews to find the best sellers across the province. With Emoorm's buyer protection, your money is secured until you receive and are satisfied with your order. Every purchase directly supports a hardworking Mindoro family — shop with confidence knowing your peso makes a real difference.
              </p>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-[#111] mb-2.5">
                Sell Your Products on Emoorm
              </h3>
              <p className="text-[12px] text-[#777] leading-relaxed">
                Are you a local farmer, fisher, artisan, or food producer in Oriental Mindoro? Emoorm gives you the tools to reach more customers online with zero hassle. List your products in minutes, manage orders through the Emoorm Seller Center, and grow your business with access to buyers across the province and beyond. Whether you produce organic vegetables, fresh seafood, or one-of-a-kind handicrafts, there is a market waiting for you on Emoorm. Register as a seller today and bring your products to new heights.
              </p>
            </div>
          </div>

          {/* Wide paragraph */}
          <div className="mb-8">
            <h3 className="text-[13px] font-semibold text-[#111] mb-2.5">
              Discover Authentic Products from Every Corner of Oriental Mindoro
            </h3>
            <p className="text-[12px] text-[#777] leading-relaxed mb-2">
              Emoorm is your one-stop destination for everything locally grown and made across the municipalities of Oriental Mindoro. Find the freshest vegetables straight from Naujan's farms, premium rice and grains from Bongabong and Gloria, and the finest seafood harvested from Puerto Galera's coastal waters. Craving something unique? Explore our Delicacies section for time-honored Mindoreno treats — perfect as pasalubong, gifts, or everyday indulgences. Discover handcrafted pieces in our Handicrafts category, made by skilled local artisans in Calapan City, Pinamalayan, Roxas, and more.
            </p>
            <p className="text-[12px] text-[#777] leading-relaxed">
              Health-conscious shoppers will love our Wellness category featuring natural, farm-sourced health products. Home cooks can browse Meat & Poultry, fresh Fruits, and seasonal produce sourced directly from growers — no middlemen, just real freshness at honest prices. On Emoorm, every order you place goes straight to a local producer in one of Oriental Mindoro's sixteen municipalities: Baco, Bansud, Bongabong, Bulalacao, Calapan City, Gloria, Mansalay, Naujan, Pinamalayan, Pola, Puerto Galera, Roxas, San Teodoro, Socorro, and Victoria. Shop local, eat fresh, and help Mindoro thrive.
            </p>
          </div>

          {/* Categories grid */}
          <div>
            <h3 className="text-[13px] font-semibold text-[#111] mb-3">
              Product Categories on Emoorm
            </h3>
            <div className="grid grid-cols-3 gap-6 text-[12px] text-[#777]">
              <div>
                <p className="font-semibold text-[#444] mb-1.5">Fresh Produce</p>
                <p className="leading-relaxed">
                  <Link href="/?cat=Vegetables" className="hover:text-[#29a366] transition-colors">Vegetables</Link>
                  {" · "}
                  <Link href="/?cat=Fruits" className="hover:text-[#29a366] transition-colors">Fruits</Link>
                  {" · "}
                  <Link href="/?cat=Meat" className="hover:text-[#29a366] transition-colors">Meat & Poultry</Link>
                  {" · "}
                  <Link href="/?cat=Seafood" className="hover:text-[#29a366] transition-colors">Seafood</Link>
                  {" · "}
                  <Link href="/?cat=Rice+%26+Grains" className="hover:text-[#29a366] transition-colors">Rice & Grains</Link>
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#444] mb-1.5">Food & Snacks</p>
                <p className="leading-relaxed">
                  <Link href="/?cat=Delicacies" className="hover:text-[#29a366] transition-colors">Delicacies</Link>
                  {" · "}
                  <Link href="/?cat=Snacks" className="hover:text-[#29a366] transition-colors">Snacks</Link>
                  {" · "}
                  <span>Preserved Foods</span>
                  {" · "}
                  <span>Local Pasalubong</span>
                  {" · "}
                  <span>Organic & Natural Foods</span>
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#444] mb-1.5">Lifestyle & Crafts</p>
                <p className="leading-relaxed">
                  <Link href="/?cat=Handicrafts" className="hover:text-[#29a366] transition-colors">Handicrafts</Link>
                  {" · "}
                  <Link href="/?cat=Wellness" className="hover:text-[#29a366] transition-colors">Wellness</Link>
                  {" · "}
                  <span>Natural Products</span>
                  {" · "}
                  <span>Home Goods</span>
                  {" · "}
                  <span>Woven Items</span>
                  {" · "}
                  <span>Artisanal Crafts</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

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
              className="text-[13px] font-semibold text-[#111]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Emoorm
            </span>
          </Link>
          <p className="text-[12px] text-[#555] leading-relaxed mb-5 max-w-[280px]">
            Your hyperlocal marketplace for fresh, authentic goods from Oriental
            Mindoro, Philippines. Supporting local farmers and producers.
          </p>
          <div className="flex items-start gap-2 text-[12px] text-[#555] mb-2">
            <MapPin className="h-3.5 w-3.5 text-[#29a366] shrink-0 mt-0.5" />
            <span>Oriental Mindoro, Philippines</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#555] mb-2">
            <Phone className="h-3.5 w-3.5 text-[#29a366] shrink-0" />
            <span>+63 915 193 1262</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#555] mb-5">
            <Mail className="h-3.5 w-3.5 text-[#29a366] shrink-0" />
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
          <h4 className="text-[13px] font-semibold text-[#111] mb-4">Shop</h4>
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
                  className="text-[12px] text-[#555] hover:text-[#29a366] transition-colors"
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="text-[13px] font-semibold text-[#111] mb-4">Account</h4>
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
                  className="text-[12px] text-[#555] hover:text-[#29a366] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="text-[13px] font-semibold text-[#111] mb-4">
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
                  className="text-[12px] text-[#555] hover:text-[#29a366] transition-colors"
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
          <p className="text-[12px] text-[#999]">
            © {new Date().getFullYear()} Emoorm. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[12px] text-[#999] hover:text-[#444] transition-colors">Privacy</Link>
            <Link href="/terms" className="text-[12px] text-[#999] hover:text-[#444] transition-colors">Terms</Link>
            <Link href="/sitemap" className="text-[12px] text-[#999] hover:text-[#444] transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

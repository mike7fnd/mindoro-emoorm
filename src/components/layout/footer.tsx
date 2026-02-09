import React from "react";

export function Footer() {
  return (
    <footer className="hidden md:block w-full bg-[#e4e4e4] text-black py-9 px-5 mt-[22px]" role="contentinfo" aria-label="Footer">
      <div className="max-w-[1480px] mx-auto flex flex-wrap gap-[30px] items-start justify-between">
        {/* Left Column: Address */}
        <div className="px-[17px] flex-1 min-w-[240px]">
          <h3 className="text-[#020202] m-0 mb-2 text-[0.95rem] font-semibold">Address</h3>
          <p className="m-0 text-black leading-relaxed text-[0.94rem]">
            Balahid, Hagan, Bongabong<br />
            Oriental Mindoro, PH
          </p>
        </div>

        {/* Center Column: Branding */}
        <div className="px-[17px] flex-1 min-w-[240px] text-center">
          <div className="font-headline italic text-[1.35rem] text-[#070707] tracking-[0.5px]">
            Bella's Paradise
          </div>
          <div className="mt-2.5 text-black text-[0.95rem] tracking-[1px]">
            ★★★★★
          </div>
        </div>

        {/* Right Column: Contact */}
        <div className="px-[17px] flex-1 min-w-[240px] text-right">
          <h3 className="text-[#020202] m-0 mb-2 text-[0.95rem] font-semibold">Contact Us</h3>
          <p className="m-0 text-black leading-relaxed text-[0.94rem]">
            0977 445 8694<br />
            bellasparadisefarmresort@gmail.com
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Image from 'next/image';

export default function Logo() {
  return (
    <div
      className="flex items-center font-bold hover:opacity-90 transition-opacity"
      aria-label="ChildminderConnect Home"
    >
      <Image
        src="/images/logo.svg"
        alt="ChildminderConnect Logo"
        width={198}
        height={34}
        priority
      />
    </div>
  );
}
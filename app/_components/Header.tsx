import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Header = () => {
  return (
    <nav className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <Image src={"/logo.svg"} alt="logo" width={40} height={40} />

        <h1 className="text-base font-bold md:text-2xl">Crack IT</h1>
      </div>
      <Link href="/dashboard">
        <Button>Get Started</Button>
      </Link>
    </nav>
  );
};

export default Header;

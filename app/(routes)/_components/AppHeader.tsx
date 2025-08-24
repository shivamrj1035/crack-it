import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const MenuOptions = [
  {
    name: "Dashboard",
    path: "/dashboard",
  },
  // {
  //   name: "Upgrade",
  //   path: "/upgrade",
  // },
  // {
  //   name: "How it works?",
  //   path: "/how-it-works",
  // },
];

const AppHeader = () => {
  return (
    <nav className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Image src={"/logo.svg"} alt="logo" width={40} height={40} />
        </Link>

        {/* <h1 className="text-base font-bold md:text-2xl">Crack IT</h1> */}
      </div>
      <div>
        <ul className="flex items-center gap-4">
          {MenuOptions.map((option) => (
            <li
              key={option.name}
              className="text-lg hover:scale-110 transition-transform cursor-pointer"
            >
              <a
                href={option.path}
                className="text-sm font-medium text-neutral-700 hover:text-blue-500 dark:text-neutral-300 dark:hover:text-blue-400"
              >
                {option.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <UserButton />
    </nav>
  );
};

export default AppHeader;

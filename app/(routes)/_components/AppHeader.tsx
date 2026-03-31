"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Moon, Sun, LayoutDashboard, Users, BarChart3, BriefcaseIcon } from "lucide-react";

const MenuOptions = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Interviewers", path: "/admin/interviewers", icon: BriefcaseIcon },
  { name: "Talent", path: "/admin/talent", icon: Users },
  { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
];

const AppHeader = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "glass border-b shadow-md shadow-primary/5"
          : "border-b border-border/50 bg-background/80 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div whileHover={{ rotate: -8, scale: 1.05 }} transition={{ type: "spring", stiffness: 400 }}>
            <Image src="/logo.svg" alt="logo" width={32} height={32} className="drop-shadow-sm" />
          </motion.div>
          <span className="text-base font-bold tracking-tight hidden sm:block">
            <span className="text-gradient">Crack</span>
            <span className="text-foreground">-IT</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {MenuOptions.map((option) => {
            const isActive = pathname === option.path;
            return (
              <Link key={option.name} href={option.path}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <option.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
                  {option.name}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 rounded-full bg-primary/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {mounted && (
            <motion.button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200"
              aria-label="Toggle theme"
            >
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </motion.div>
            </motion.button>
          )}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/50 transition-all",
              },
            }}
          />
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-none">
        {MenuOptions.map((option) => {
          const isActive = pathname === option.path;
          return (
            <Link key={option.name} href={option.path}>
              <div
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <option.icon className="h-3 w-3" />
                {option.name}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AppHeader;

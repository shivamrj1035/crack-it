"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { SparklesIcon, ArrowRight } from "lucide-react";

const EmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      {/* Ambient glow decoration */}
      <div className="relative mb-8">
        <div className="absolute inset-0 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
        <motion.div
          animate={{ scale: [1, 1.06, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10"
        >
          <SparklesIcon className="h-10 w-10 text-primary" />
        </motion.div>
      </div>

      <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
        No Interviews Yet
      </h2>
      <p className="mb-8 max-w-sm text-muted-foreground">
        Create your first AI-powered mock interview and start practicing for your dream role today.
      </p>

      <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
        <Link href="/dashboard">
          <button className="btn-gradient group flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold shadow-xl">
            Create Your First Interview
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;

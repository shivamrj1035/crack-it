"use client";
import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight, Star, Shield, Brain, Zap } from "lucide-react";

const features = [
  { icon: Brain, text: "AI-Powered Questions" },
  { icon: Shield, text: "Proctoring Built-in" },
  { icon: Zap, text: "Instant Feedback" },
  { icon: Star, text: "Multi-role Interviewers" },
];

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/20" />
        <div className="absolute -right-32 top-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/15" />
        <div className="absolute -left-32 bottom-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Side decorative lines */}
      <div className="absolute inset-y-0 left-0 w-px bg-border/60">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "10rem" }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="w-px bg-gradient-to-b from-transparent via-primary to-transparent"
        />
      </div>
      <div className="absolute inset-y-0 right-0 w-px bg-border/60">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "10rem" }}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
          className="w-px bg-gradient-to-b from-transparent via-primary to-transparent"
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-20 md:pt-32">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Interview Coaching Platform
          </div>
        </motion.div>

        {/* Headline */}
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          {"Ace Your Next Interview with"
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(8px)", y: 20 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.07, ease: "easeOut" }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
          <motion.span
            initial={{ opacity: 0, filter: "blur(8px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="text-gradient inline-block mr-2"
          >
            AI-Powered
          </motion.span>
          <motion.span
            initial={{ opacity: 0, filter: "blur(8px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            className="inline-block"
          >
            Practice
          </motion.span>
        </h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
          className="relative z-10 mx-auto mt-6 max-w-xl text-center text-lg text-muted-foreground"
        >
          Prepare like a pro with realistic, human-like mock interviews powered
          by AI. Get instant feedback, improve your answers, and land your dream role.
        </motion.p>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.85 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + i * 0.06 }}
              className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
            >
              <f.icon className="h-3 w-3 text-primary" />
              {f.text}
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.1 }}
          className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="btn-gradient group flex items-center gap-2 rounded-full px-7 py-3 text-base font-semibold shadow-xl"
            >
              Start Practicing Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>

          <Link href="https://github.com/shivamrj1035" target="_blank">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-7 py-3 text-base font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
            >
              View on GitHub
            </motion.button>
          </Link>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mt-20"
        >
          {/* Glow behind image */}
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl dark:bg-primary/20" />

          <div className="overflow-hidden rounded-3xl border border-border bg-card/50 p-2 shadow-2xl shadow-primary/10 backdrop-blur-sm">
            <div className="overflow-hidden rounded-2xl border border-border/50">
              <div className="flex items-center gap-1.5 bg-muted/60 px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">crack-it.app/interview</span>
              </div>
              <img
                src="/hero.png"
                alt="Crack-IT Interview Platform preview"
                className="aspect-[16/9] h-auto w-full object-cover"
                width={1200}
                height={675}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

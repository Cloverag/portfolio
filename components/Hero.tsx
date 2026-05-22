"use client";

import dynamic from "next/dynamic";
import { ArrowDown, Mail } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import Link from "next/link";

const ShaderBackground = dynamic(() => import("./ShaderBackground"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
  ),
});

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <ShaderBackground />
      </div>

      <div className="absolute inset-0 bg-background/60 dark:bg-background/50 z-10" />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-background/20 to-background dark:via-background/30" />

      <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
        <p className="font-mono text-sm text-muted mb-4 animate-fade-up tracking-widest uppercase">
          Hi there, I&apos;m
        </p>

        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 animate-fade-up delay-100 text-liquid">
          RAGHAV
        </h1>

        <p className="text-xl md:text-2xl text-foreground/90 mb-2 animate-fade-up delay-200 font-light">
          ML Engineer
          <span className="text-muted mx-3">/</span>
          Cloud Architect
          <span className="text-muted mx-3">/</span>
          <span className="text-gradient font-semibold">Security Researcher</span>
        </p>

        <p className="text-sm md:text-base text-muted max-w-xl mx-auto mb-10 animate-fade-up delay-300">
          B.Tech Data Science & Analytics @ IIIT Nagpur. I train models, ship cloud infra, and break Firebase keys for fun.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up delay-400">
          <Link
            href="#projects"
            className="px-6 py-3 rounded-full bg-foreground text-background font-medium text-sm hover:scale-105 active:scale-95 transition-transform"
          >
            View Projects
          </Link>
          <Link
            href="/resume.pdf"
            target="_blank"
            className="px-6 py-3 rounded-full glass font-medium text-sm hover:scale-105 active:scale-95 transition-transform"
          >
            Resume
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <a
              href="https://github.com/Cloverag"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="GitHub"
            >
              <FaGithub className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com/in/raghav-singh"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="w-4 h-4" />
            </a>
            <a
              href="mailto:byjsuynr222@gmail.com"
              className="w-11 h-11 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <ArrowDown className="w-5 h-5 text-muted" />
      </div>
    </section>
  );
}

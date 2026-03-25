"use client"

import React from "react"
import { motion } from "framer-motion"

interface CndProcessingCircleProps {
  percentage: number;
}

export function CndProcessingCircle({ percentage }: CndProcessingCircleProps) {
  // Ensure percentage is between 0 and 100
  const validPercentage = Math.max(0, Math.min(100, percentage));
  
  // Calculate stroke dasharray for SVG circle
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;

  return (
    <div className="flex items-center justify-center my-8 relative">
      <div className="absolute inset-0 bg-lime-500/5 blur-[60px] rounded-full"></div>
      <div className="relative flex h-60 w-60 items-center justify-center">
        {/* Background Circle */}
        <div className="absolute inset-0 rounded-full border-4 border-zinc-800/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
        
        {/* SVG for smooth percentage contour */}
        <svg 
          className="absolute inset-0 h-full w-full -rotate-90 transform drop-shadow-[0_0_10px_rgba(132,204,22,0.3)]"
          viewBox="0 0 240 240"
        >
          <motion.circle
            cx="120"
            cy="120"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="4"
            className="text-lime-500"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-4 rounded-full bg-zinc-900/80 backdrop-blur-md flex items-center justify-center flex-col border border-zinc-800 shadow-2xl">
          <motion.p 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-6xl font-light text-zinc-100 tracking-tighter"
          >
            {validPercentage}<span className="text-3xl text-lime-500 font-medium ml-1">%</span>
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-[10px] text-zinc-500 mt-2 uppercase tracking-[0.2em] font-bold"
          >
            Processado
          </motion.p>
        </div>
      </div>
    </div>
  )
}

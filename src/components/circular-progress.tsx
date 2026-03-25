"use client"

import React from "react"

interface CircularProgressProps {
  value: number; // 0 to 100
  label?: string;
  size?: number;
}

export function CircularProgress({ value, label = "Processado", size = 240 }: CircularProgressProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center justify-center">
      <div 
        className="relative flex items-center justify-center" 
        style={{ width: size, height: size }}
      >
        {/* Fundo do anel (Contorno) */}
        <svg className="absolute inset-0 transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-gray-700/30"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Anel de progresso */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-lime-400 transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Círculo central com glassmorphism */}
        <div className="absolute inset-4 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center flex-col">
          <p className="text-6xl font-light text-white">{value}%</p>
          <p className="text-xs text-gray-300 uppercase tracking-wider mt-2">{label}</p>
        </div>
      </div>
    </div>
  )
}

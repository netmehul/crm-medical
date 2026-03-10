"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sparklineData?: number[];
  delay?: number;
  isCurrency?: boolean;
}

export default function StatCard({ label, value, icon, color, sparklineData, delay = 0, isCurrency = false }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(0);

  useEffect(() => {
    if (typeof value === 'string') {
      setDisplayValue(value);
      return;
    }

    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  const data = (sparklineData || [12, 15, 10, 18, 14, 20, 16]).map((v, i) => ({ v, i }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      className="glass-card glass-card-hover p-4 md:p-5 relative overflow-hidden group cursor-default h-full"
    >
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <p className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider">{label}</p>
        <span style={{ color }} className="opacity-70 group-hover:opacity-100 transition-opacity">
          {icon}
        </span>
      </div>
      <p className={`text-xl md:text-3xl font-mono font-bold tabular-nums ${isCurrency ? 'text-lg md:text-2xl' : ''}`} style={{ color }}>
        {displayValue}
      </p>
      <div className="absolute bottom-0 right-0 w-24 h-12 opacity-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

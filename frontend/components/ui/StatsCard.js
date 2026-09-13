'use client';
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'accent' }) {
  
  const colorMap = {
    accent: 'text-accent bg-accent/10 border-accent',
    success: 'text-success bg-success/10 border-success',
    warning: 'text-warning bg-warning/10 border-warning',
    error: 'text-error bg-error/10 border-error',
  };

  const styleClass = colorMap[color] || colorMap.accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-bg-card rounded-2xl p-6 border border-gray-800 shadow-sm relative overflow-hidden group"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styleClass.split(' ')[1]} opacity-50`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2">
              {trend && (
                <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-success' : 'text-error'}`}>
                  {trend}
                </span>
              )}
              {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
            </div>
          )}
        </div>
        
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${styleClass.split(' ').slice(0,2).join(' ')} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

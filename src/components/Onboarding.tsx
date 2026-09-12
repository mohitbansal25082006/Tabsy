import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, FolderHeart, RefreshCw, Cloud, X, ChevronRight, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {/* Animated Blobs */}
    <motion.div 
      animate={{ 
        scale: [1, 1.1, 1],
        rotate: [0, 90, 0],
        x: ['-10%', '5%', '-10%'],
        y: ['-10%', '10%', '-10%']
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-[20%] -left-[20%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-blue-300/40 to-cyan-300/40 dark:from-blue-600/20 dark:to-cyan-600/20 blur-[80px] opacity-70"
    />
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        rotate: [0, -90, 0],
        x: ['10%', '-5%', '10%'],
        y: ['10%', '-10%', '10%']
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -bottom-[20%] -right-[20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-purple-300/40 to-pink-300/40 dark:from-purple-600/20 dark:to-pink-600/20 blur-[80px] opacity-70"
    />
    {/* Subtle grid overlay */}
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMTUwLCAxNTAsIDE1MCwgMC4xKSIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,white,transparent)] z-0"></div>
  </div>
);

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Tabsy",
      highlight: "Tabsy",
      description: "Your intelligent workspace manager. Reclaim your focus and drastically reduce memory usage by organizing tabs into dedicated worlds.",
      icon: <Layers className="w-12 h-12 text-white" strokeWidth={1.5} />,
      gradient: "from-blue-500 to-cyan-400",
      shadow: "shadow-blue-500/50",
    },
    {
      title: "Master your Folders",
      highlight: "Folders",
      description: "Group related workspaces into nested folders. Keep your 'Work', 'Research', and 'Play' completely separated.",
      icon: <FolderHeart className="w-12 h-12 text-white" strokeWidth={1.5} />,
      gradient: "from-purple-500 to-pink-400",
      shadow: "shadow-purple-500/50",
    },
    {
      title: "Smart Restores",
      highlight: "Restores",
      description: "Bring workspaces back exactly how you need them. Merge them into your current window, or open them completely isolated.",
      icon: <RefreshCw className="w-12 h-12 text-white" strokeWidth={1.5} />,
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-500/50",
    },
    {
      title: "Sync Everywhere",
      highlight: "Sync",
      description: "Tabsy syncs seamlessly across all your devices in real-time. Your workspaces are always right where you left them.",
      icon: <Cloud className="w-12 h-12 text-white" strokeWidth={1.5} />,
      gradient: "from-indigo-500 to-violet-400",
      shadow: "shadow-indigo-500/50",
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25, staggerChildren: 0.1 } },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  const currentStep = steps[step];

  // Split title to highlight part of it
  const titleParts = currentStep.title.split(currentStep.highlight);

  return (
    <div className="fixed inset-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl z-[100] flex flex-col font-sans overflow-y-auto">
      <BackgroundEffects />

      {/* Header */}
      <div className="flex justify-end p-4 relative z-10 shrink-0">
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(156, 163, 175, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 text-sm font-semibold tracking-wide"
        >
          Skip
          <X size={16} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-md mx-auto min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full flex flex-col items-center"
          >
            {/* Floating Icon Hexagon / Circle */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotate: 5 }}
              className={`relative mb-6 w-20 h-20 rounded-3xl bg-gradient-to-br ${currentStep.gradient} flex items-center justify-center shadow-2xl ${currentStep.shadow} ring-4 ring-white/50 dark:ring-gray-900/50`}
            >
              <div className="absolute inset-0 bg-white/20 rounded-3xl [clip-path:polygon(0_0,100%_0,100%_40%,0_100%)]"></div>
              {React.cloneElement(currentStep.icon, { className: "w-10 h-10 text-white" })}
            </motion.div>

            {/* Typography */}
            <motion.div variants={itemVariants} className="text-center mb-4">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                {titleParts[0]}
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${currentStep.gradient}`}>
                  {currentStep.highlight}
                </span>
                {titleParts[1]}
              </h1>
            </motion.div>

            <motion.p 
              variants={itemVariants}
              className="text-center text-gray-600 dark:text-gray-300/90 text-sm leading-relaxed max-w-[280px]"
            >
              {currentStep.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="p-6 relative z-10 flex flex-col items-center gap-6 w-full max-w-md mx-auto shrink-0">
        
        {/* Animated Progress Dots */}
        <div className="flex gap-2">
          {steps.map((_, index) => (
            <div key={index} className="relative flex items-center justify-center">
              <motion.div
                initial={false}
                animate={{
                  width: index === step ? 24 : 8,
                  backgroundColor: index === step ? '#3B82F6' : '#D1D5DB' // gray-300
                }}
                className={`h-2 rounded-full ${index === step ? 'dark:bg-blue-500' : 'dark:bg-gray-700'}`}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            </div>
          ))}
        </div>

        {/* Next / Finish Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="w-full relative group overflow-hidden rounded-2xl p-[2px]"
        >
          {/* Animated gradient border */}
          <span className={`absolute inset-0 bg-gradient-to-r ${currentStep.gradient} opacity-70 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}></span>
          
          <div className="relative bg-white dark:bg-gray-900 px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all">
            <span className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${currentStep.gradient} text-lg`}>
              {step === steps.length - 1 ? "Let's Go" : "Continue"}
            </span>
            
            {step < steps.length - 1 && (
              <ChevronRight className={`w-5 h-5 text-transparent [stroke:url(#btn-grad)] group-hover:translate-x-1 transition-transform`} />
            )}

            {/* SVG Gradient Definition for Icons */}
            <svg width="0" height="0" className="absolute">
              <linearGradient id="btn-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                {/* Simplified static gradient for the icon just to match the vibe */}
                <stop offset="0%" stopColor={step === 0 ? '#3B82F6' : step === 1 ? '#A855F7' : step === 2 ? '#10B981' : '#6366f1'} />
                <stop offset="100%" stopColor={step === 0 ? '#22d3ee' : step === 1 ? '#f472b6' : step === 2 ? '#2dd4bf' : '#a78bfa'} />
              </linearGradient>
            </svg>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

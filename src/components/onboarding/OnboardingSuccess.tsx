// ============================================================
// FILE: src/components/onboarding/OnboardingSuccess.tsx (NEW)
// ============================================================
import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Users, Trophy } from 'lucide-react'

const OnboardingSuccess: React.FC = () => {
    const navigate = useNavigate()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center text-center px-4 py-6 w-full max-w-md mx-auto"
        >
            {/* Illustration */}
            <div className="mb-8 w-full max-w-xs mx-auto aspect-square bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-indigo-600 blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-purple-600 blur-3xl" />
                </div>
                <div className="relative flex items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center">
                        <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-amber-600" />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                همه چیز آماده است! 🎉
            </h2>

            {/* Description */}
            <p className="text-sm md:text-base text-gray-500 max-w-sm leading-relaxed">
                برای شما در مسیر المپیاد آرزوی موفقیت داریم.
                <br />
                ثابت‌قدم باش، یاد بگیر، و به بهبود ادامه بده.
                <br />
                <span className="text-indigo-600 font-medium">موفق باشید و از Repolym لذت ببرید.</span>
            </p>

            {/* Button */}
            <button
                onClick={() => navigate('/dashboard', { replace: true })}
                className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
            >
                رفتن به داشبورد →
            </button>
        </motion.div>
    )
}

export default OnboardingSuccess
// src/components/auth/AuthLayout.tsx (fix logo)
import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TrendingUp, Zap } from 'lucide-react'
import { OLYMPIAD_ICON_MAP } from '../../config/olympiad-icons'
import type { OlympiadTheme } from '../../config/olympiads'
import { OlympiadAmbient } from '../common/OlympiadAmbient'

interface AuthLayoutProps {
  children: React.ReactNode
  olympiadTheme?: OlympiadTheme | null
  wide?: boolean
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, olympiadTheme, wide = false }) => {
  const gradient = olympiadTheme?.gradient ?? 'from-indigo-600 via-purple-600 to-pink-500'
  const OlympiadIcon = olympiadTheme ? OLYMPIAD_ICON_MAP[olympiadTheme.icon] : null

  return (
    <div className="min-h-screen flex" dir="rtl">
      <AnimatePresence mode="wait">
        <motion.div
          key={olympiadTheme?.id ?? 'default'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`hidden lg:flex lg:w-5/12 bg-gradient-to-br ${gradient} relative overflow-hidden`}
        >
          <motion.div
            className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-24 -right-16 w-96 h-96 bg-white/5 rounded-full blur-3xl"
            animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/3 left-1/4 w-48 h-48 bg-yellow-300/20 rounded-full blur-2xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          {olympiadTheme && olympiadTheme.effect !== 'organic' && (
            <OlympiadAmbient effect={olympiadTheme.effect} color="#ffffff" className="opacity-70" />
          )}

          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-10"
            >
              {OlympiadIcon ? (
                <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <OlympiadIcon className="w-12 h-12 text-white" />
                </div>
              ) : (
                <img src={import.meta.env.BASE_URL + 'logo.png'} alt="لوگو" className="h-48 w-auto object-contain drop-shadow-2xl" />
              )}
              <div className="w-20 h-1.5 bg-yellow-300 rounded-full mt-5" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-extrabold leading-snug mb-5"
            >
              {olympiadTheme ? (
                <span className="text-white/90">{olympiadTheme.label}</span>
              ) : (
                <>
                  <span className="text-white/90">هر روز،</span>
                  <br />
                </>
              )}
              {!olympiadTheme && (
                <motion.span
                  className="text-yellow-300"
                  animate={{ textShadow: ['0 0 10px #fde047', '0 0 20px #fde047', '0 0 10px #fde047'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  یک قدم نزدیک‌تر
                </motion.span>
              )}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/70 max-w-xs text-base"
            >
              {olympiadTheme
                ? olympiadTheme.tagline
                : 'پیشرفتت را هوشمند رصد کن و با انگیزه به سمت موفقیت در المپیاد حرکت کن.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex gap-8 mt-12"
            >
              <div className="flex items-center gap-2.5 text-white/80">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium">هوشمند</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/80">
                <TrendingUp className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium">شگفت انگیز</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className={`w-full transition-[max-width] duration-300 ${wide ? 'max-w-xl' : 'max-w-md'}`}
        >
          <div className="lg:hidden mb-8 text-center">
            <img src={import.meta.env.BASE_URL + 'logo.png'} alt="لوگو" className="h-48 w-auto object-contain drop-shadow-2xl" />
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/10 p-8 border border-white/50">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
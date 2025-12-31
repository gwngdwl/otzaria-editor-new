'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function HomePage() {
  const features = [
    {
      icon: 'library_books',
      title: 'ספרייה עשירה',
      description: 'מאגר ספרים תורניים רחב ומקיף'
    },
    {
      icon: 'edit_note',
      title: 'עריכה משותפת',
      description: 'הצטרפו לקהילה ועזרו להגדיל את המאגר'
    },
    {
      icon: 'volunteer_activism',
      title: 'חינם לחלוטין',
      description: 'הפלטפורמה חינמית ותישאר כזו לעד'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden flex-1">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary-container via-background to-secondary-container opacity-50" />
        
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              className="mb-8 flex justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Image src="/logo.png" alt="לוגו אוצריא" width={120} height={120} className="drop-shadow-2xl" />
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 text-on-background"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              ספריית אוצריא
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl mb-8 text-on-surface/80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              פלטפורמה משותפת לעריכה ושיתוף של ספרי קודש
            </motion.p>
            
            <motion.p 
              className="text-lg mb-12 text-on-surface/70 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              הצטרפו למהפכה הדיגיטלית של ספרות התורה. ערכו, שתפו והוסיפו ספרים חדשים 
              למאגר הגדול ביותר של טקסטים תורניים מדויקים ונגישים לכולם.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link 
                href="/books" 
                className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-lg text-lg font-medium hover:bg-accent transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined">library_books</span>
                <span>עיין בספרייה</span>
              </Link>
              <Link 
                href="/about" 
                className="flex items-center justify-center gap-2 px-8 py-4 glass border-2 border-primary text-primary rounded-lg text-lg font-medium hover:bg-primary-container transition-colors"
              >
                <span className="material-symbols-outlined">info</span>
                <span>אודות הספרייה</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-surface">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-on-surface">
            מה מייחד אותנו?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass p-6 rounded-xl text-center"
              >
                <span className="material-symbols-outlined text-5xl text-primary mb-4 block">
                  {feature.icon}
                </span>
                <h3 className="text-xl font-bold mb-2 text-on-surface">{feature.title}</h3>
                <p className="text-on-surface/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

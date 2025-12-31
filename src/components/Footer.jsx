import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-surface-variant py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-on-surface">אודות</h3>
            <p className="text-on-surface/70 text-sm leading-relaxed">
              ספריית אוצריא היא פלטפורמה משותפת לעריכה ושיתוף של ספרי קודש.
              המטרה שלנו היא להנגיש את הספרות התורנית לכולם.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-on-surface">קישורים</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/books" className="text-on-surface/70 hover:text-primary transition-colors">
                  הספרייה
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-on-surface/70 hover:text-primary transition-colors">
                  אודות
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-on-surface/70 hover:text-primary transition-colors">
                  שאלות נפוצות
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-on-surface">צור קשר</h3>
            <p className="text-on-surface/70 text-sm">
              יש לך שאלה או הצעה?
              <br />
              <Link href="/dashboard" className="text-primary hover:text-accent">
                שלח לנו הודעה
              </Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-surface-variant text-center text-sm text-on-surface/60">
          <p>© {new Date().getFullYear()} ספריית אוצריא. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  )
}

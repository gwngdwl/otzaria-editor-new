# ספריית אוצריא - גרסה חדשה

מערכת לעריכת ספרים עבריים עתיקים עם OCR.

## שינויים מהגרסה הקודמת

- **MySQL** במקום MongoDB
- **אחסון מקומי** במקום שירותים חיצוניים (GitHub, Backblaze, ImgBB)
- קוד נקי ומסודר יותר

## התקנה

### דרישות מקדימות

- Node.js 18+
- MySQL 8.0+

### שלבים

1. התקן תלויות:
```bash
npm install
```

2. צור קובץ `.env` מתוך `.env.example`:
```bash
cp .env.example .env
```

3. ערוך את `.env` עם פרטי החיבור למסד הנתונים:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=otzaria
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

4. צור את מסד הנתונים:
```bash
mysql -u root -p < database/schema.sql
```

5. הרץ את הפרויקט:
```bash
npm run dev
```

## מבנה הפרויקט

```
otzaria-new/
├── database/
│   └── schema.sql          # סכמת MySQL
├── public/
│   ├── uploads/            # קבצים שהועלו
│   ├── fonts/              # גופנים
│   └── logo.png            # לוגו
├── scripts/
│   ├── migrate.js          # סקריפט מיגרציה
│   └── seed.js             # נתוני בדיקה
├── src/
│   ├── app/
│   │   ├── admin/          # פאנל ניהול
│   │   ├── api/            # API routes
│   │   ├── auth/           # התחברות/הרשמה
│   │   ├── book/           # צפייה בספר
│   │   ├── books/          # רשימת ספרים
│   │   ├── dashboard/      # דשבורד משתמש
│   │   ├── edit/           # עריכת עמוד
│   │   ├── upload/         # העלאת ספר
│   │   └── users/          # רשימת משתמשים
│   ├── components/         # קומפוננטות משותפות
│   ├── lib/
│   │   ├── models/         # מודלים
│   │   ├── db.js           # חיבור MySQL
│   │   ├── storage.js      # אחסון קבצים
│   │   └── utils.js        # פונקציות עזר
│   └── styles/
│       └── globals.css     # סגנונות גלובליים
└── package.json
```

## תכונות

- **עריכת טקסט** - עורך עם תמיכה בשני טורים
- **OCR** - זיהוי טקסט עם Tesseract ו-Gemini AI
- **ניהול משתמשים** - מערכת נקודות ודירוג
- **פאנל ניהול** - ניהול ספרים, משתמשים והעלאות
- **הודעות** - מערכת הודעות פנימית

## פריסה ב-Hostinger

1. העלה את הקבצים לשרת
2. צור מסד נתונים MySQL
3. הגדר את משתני הסביבה
4. הרץ `npm run build`
5. הפעל עם `npm start`

## רישיון

MIT

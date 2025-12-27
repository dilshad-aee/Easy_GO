# Easy-Go Quiz Application

A professional, clean quiz application with modern UI design.

## 📁 Project Structure

```
quizapp/
├── app.py                      # Flask backend server
├── requirements.txt            # Python dependencies
├── data/
│   └── questions.json         # Quiz questions database (14 chapters, 300 questions)
├── static/
│   ├── index.html             # Main page (Home, Quiz Setup, Quiz, Results)
│   ├── settings.html          # Settings page (JSON upload, theme toggle)
│   ├── analytics.html         # Analytics page (performance charts)
│   ├── css/
│   │   ├── design-system.css  # Design tokens (colors, spacing, typography)
│   │   ├── components.css     # Reusable components (buttons, cards, forms)
│   │   └── styles.css         # Application-specific styles
│   └── js/
│       ├── app.js             # Main app logic & navigation
│       ├── quiz.js            # Quiz engine & question handling
│       ├── storage.js         # LocalStorage management
│       ├── settings.js        # Settings page functionality
│       └── analytics.js       # Analytics & charts
└── venv/                      # Python virtual environment
```

## 🚀 Features

- **14 Topic Chapters** - 300 questions organized by topic
- **Custom JSON Upload** - Upload your own question sets
- **Skip Questions** - Skip difficult questions and return later
- **Detailed Results** - Accuracy, correct/wrong/missed breakdown, topics covered
- **Analytics Dashboard** - Performance tracking with charts
- **Theme Toggle** - Light/Dark mode
- **Responsive Design** - Works on all devices
- **Professional UI** - Clean white/black/orange design

## 🛠️ Installation

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Mac/Linux
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Open in browser:**
   ```
   http://localhost:5001
   ```

## 📝 Custom Questions Format

Upload JSON files in Settings with this format:

```json
[
  {
    "question": "What is the full form of CPU?",
    "options": [
      "Central Processing Unit",
      "Computer Personal Unit",
      "Central Program Unit",
      "Computer Processing Unit"
    ],
    "correctAnswer": 0,
    "explanation": "CPU stands for Central Processing Unit",
    "topic": "Computer Architecture"
  }
]
```

## 🎨 Design Principles

- **Contrast** - High readability with proper color contrast
- **Alignment** - 8px grid system for consistent spacing
- **Repetition** - Consistent patterns throughout
- **Proximity** - Related items grouped together
- **White Space** - Proper breathing room
- **Typography** - Clear hierarchy with Inter font
- **Color** - Limited white/black/orange palette

## 📊 Technologies

- **Backend:** Flask (Python)
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Charts:** Chart.js
- **Icons:** Font Awesome 6.5.1
- **Fonts:** Google Fonts (Inter)
- **Storage:** LocalStorage for persistence

## 🔧 API Endpoints

- `GET /api/chapters` - Get all available chapters
- `GET /api/questions/all` - Get all questions
- `GET /api/questions/:chapterId` - Get questions for specific chapter
- `GET /api/stats` - Get overall statistics

## 📱 Pages

1. **Home** - Welcome page with stats
2. **Quiz Setup** - Select topic, number of questions, shuffle
3. **Quiz** - Interactive quiz interface
4. **Results** - Detailed performance overview
5. **Settings** - Upload custom questions, theme toggle, data management
6. **Analytics** - Performance charts and history

## ✨ Version

**Easy-Go v2.0** - Professional Redesign

---

Made with ❤️ for better learning

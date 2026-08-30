CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,
  role_title TEXT,
  match_score REAL,
  matched_skills TEXT,
  missing_skills TEXT,
  tailored_bullets TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'drafted',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
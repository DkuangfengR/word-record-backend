CREATE TABLE IF NOT EXISTS home_colortable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  color TEXT NOT NULL,
  desc TEXT NOT NULL,
  status INTEGER NOT NULL,
  create_time DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS home_keywordtable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT DEFAULT NULL,
  keyword_heavy TEXT DEFAULT NULL,
  keyword_html TEXT,
  definition TEXT,
  industry_definition TEXT,
  anagram TEXT,
  group_id TEXT DEFAULT NULL,
  create_time DATETIME NOT NULL,
  remark TEXT
);

CREATE TABLE IF NOT EXISTS home_categorytable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  create_time DATETIME NOT NULL
);
-- Sources: built-in journals + user-added feeds
CREATE TABLE sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('openalex', 'rss', 'web')),
  category    TEXT CHECK (category IN ('academic', 'practitioner', 'industry')) DEFAULT 'industry',
  openalex_id TEXT,
  url         TEXT,
  enabled     BOOLEAN DEFAULT true,
  user_added  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Articles ingested from all sources
CREATE TABLE articles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      UUID REFERENCES sources(id),
  title          TEXT NOT NULL,
  abstract       TEXT,
  summary        TEXT,
  url            TEXT NOT NULL,
  doi            TEXT,
  authors        TEXT[],
  published_date DATE,
  ingested_at    TIMESTAMPTZ DEFAULT now(),
  external_id    TEXT UNIQUE  -- openalex ID or feed GUID, prevents re-ingestion
);

-- Fixed tag taxonomy
CREATE TABLE tags (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- Many-to-many article ↔ tag
CREATE TABLE article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     UUID REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- One digest entry per day
CREATE TABLE digests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date          DATE UNIQUE NOT NULL,
  content       TEXT NOT NULL,
  article_count INTEGER,
  top_picks     JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── TAGS ─────────────────────────────────────────────────────────────────────

INSERT INTO tags (name, slug) VALUES
  ('Consumer Behaviour',            'consumer-behaviour'),
  ('Digital Marketing',             'digital-marketing'),
  ('Advertising',                   'advertising'),
  ('Influencer Marketing',          'influencer-marketing'),
  ('Pricing',                       'pricing'),
  ('Brand Management',              'brand-management'),
  ('AI & Technology',               'ai-technology'),
  ('Data & Privacy',                'data-privacy'),
  ('Platform Economics',            'platform-economics'),
  ('Customer Experience & Loyalty', 'customer-experience-loyalty'),
  ('Behavioural Economics',         'behavioural-economics'),
  ('Innovation & Product Strategy', 'innovation-product-strategy'),
  ('B2B Marketing',                 'b2b-marketing'),
  ('Market Research & Methods',     'market-research-methods'),
  ('Social & Cultural Trends',      'social-cultural-trends'),
  ('Sales & Conversion',            'sales-conversion'),
  ('Business Strategy & Growth',    'business-strategy-growth');

-- ── ACADEMIC SOURCES (OpenAlex) ───────────────────────────────────────────────
-- Core marketing journals
INSERT INTO sources (name, type, category, openalex_id, user_added) VALUES
  ('Journal of Marketing',                          'openalex', 'academic', 'S142990027', false),
  ('Journal of Marketing Research',                 'openalex', 'academic', 'S119950638', false),
  ('Journal of Consumer Research',                  'openalex', 'academic', 'S145429826', false),
  ('Marketing Science',                             'openalex', 'academic', 'S163534328', false),
  ('Journal of the Academy of Marketing Science',   'openalex', 'academic', 'S92522684',  false),
  ('International Journal of Research in Marketing','openalex', 'academic', 'S11810700',  false),
  ('European Journal of Marketing',                 'openalex', 'academic', 'S89389284',  false);

-- Consumer psychology & behavioural science journals
INSERT INTO sources (name, type, category, openalex_id, user_added) VALUES
  ('Journal of Consumer Psychology',                'openalex', 'academic', 'S19022976',  false),
  ('Journal of Personality and Social Psychology',  'openalex', 'academic', 'S95457558',  false),
  ('Psychological Science',                         'openalex', 'academic', 'S107038143', false),
  ('Journal of Experimental Psychology: General',   'openalex', 'academic', 'S168441620', false),
  ('Organizational Behavior and Human Decision Processes', 'openalex', 'academic', 'S171562267', false);

-- Sales, B2B, and business journals
INSERT INTO sources (name, type, category, openalex_id, user_added) VALUES
  ('Industrial Marketing Management',               'openalex', 'academic', 'S106668667', false),
  ('Journal of Business Research',                  'openalex', 'academic', 'S21700975',  false),
  ('Journal of Retailing',                          'openalex', 'academic', 'S126640086', false),
  ('Strategic Management Journal',                  'openalex', 'academic', 'S65468958',  false);

-- Practitioner management journals (OpenAlex)
INSERT INTO sources (name, type, category, openalex_id, user_added) VALUES
  ('Harvard Business Review',                       'openalex', 'practitioner', 'S41416626',  false),
  ('MIT Sloan Management Review',                   'openalex', 'practitioner', 'S196034224', false);

-- ── PRACTITIONER & INDUSTRY RSS FEEDS ────────────────────────────────────────
INSERT INTO sources (name, type, category, url, user_added) VALUES
  ('McKinsey & Company',      'rss', 'practitioner', 'https://www.mckinsey.com/feeds/rss/latest-thinking',    false),
  ('The Behavioral Scientist', 'rss', 'practitioner', 'https://behavioralscientist.org/feed/',                 false),
  ('Strategy+Business',       'rss', 'practitioner', 'https://www.strategy-business.com/rss/',                false),
  ('Marketing Week',          'rss', 'industry',     'https://www.marketingweek.com/feed/',                   false),
  ('Think with Google',       'rss', 'industry',     'https://www.thinkwithgoogle.com/rss.xml',               false),
  ('MarketingProfs',          'rss', 'industry',     'https://www.marketingprofs.com/rss.asp',                false);

-- @file 002_crm_demo_data
-- @description Creates a realistic CRM demo schema with customers, contacts, deals, activities,
--   and products tables, then inserts 20+ rows of sample data for testing.
-- @remarks This data lives in the SAME database so the demo source (self-referential) can query it.
--   Tables are prefixed with crm_ to avoid conflicts with the Studio schema.

-- ============================================================================
-- CRM Demo Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name  TEXT NOT NULL,
  industry      TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'France',
  city          TEXT,
  revenue       NUMERIC(15, 2),
  employee_count INTEGER,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'churned', 'prospect', 'lead')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  role          TEXT,
  is_primary    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  price         NUMERIC(10, 2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'EUR',
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_deals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  contact_id    UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  product_id    UUID REFERENCES crm_products(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'EUR',
  stage         TEXT NOT NULL DEFAULT 'qualification' CHECK (stage IN ('lead', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability   INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  close_date    DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_activities (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  contact_id    UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id       UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task')),
  subject       TEXT NOT NULL,
  description   TEXT,
  due_date      DATE,
  completed     BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for demo queries
CREATE INDEX IF NOT EXISTS idx_crm_contacts_customer ON crm_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_customer ON crm_deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_activities_customer ON crm_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON crm_activities(deal_id);

-- ============================================================================
-- CRM Demo Data
-- ============================================================================

-- Products
INSERT INTO crm_products (id, name, category, price) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'CRM Pro License',     'software',  299.00),
  ('a0000000-0000-0000-0000-000000000002', 'Analytics Add-on',    'software',  149.00),
  ('a0000000-0000-0000-0000-000000000003', 'Support Premium',     'service',   499.00),
  ('a0000000-0000-0000-0000-000000000004', 'Training Workshop',   'service',  1200.00),
  ('a0000000-0000-0000-0000-000000000005', 'Data Migration Pack', 'service',  2500.00)
ON CONFLICT (id) DO NOTHING;

-- Customers
INSERT INTO crm_customers (id, company_name, industry, country, city, revenue, employee_count, status) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Acme Corp',            'Technology',    'France',  'Paris',     1500000.00,  120, 'active'),
  ('b0000000-0000-0000-0000-000000000002', 'Globex Industries',    'Manufacturing', 'France',  'Lyon',      3200000.00,  450, 'active'),
  ('b0000000-0000-0000-0000-000000000003', 'Initech Solutions',    'Consulting',    'Belgium', 'Brussels',   800000.00,   55, 'active'),
  ('b0000000-0000-0000-0000-000000000004', 'Umbrella Holdings',    'Finance',       'France',  'Bordeaux', 12000000.00,  800, 'active'),
  ('b0000000-0000-0000-0000-000000000005', 'Stark Dynamics',       'Technology',    'Germany', 'Berlin',    5000000.00,  300, 'prospect'),
  ('b0000000-0000-0000-0000-000000000006', 'Wayne Enterprises',    'Conglomerate',  'UK',      'London',   25000000.00, 2000, 'active'),
  ('b0000000-0000-0000-0000-000000000007', 'Cyberdyne Systems',    'Technology',    'France',  'Toulouse',  2100000.00,  180, 'prospect'),
  ('b0000000-0000-0000-0000-000000000008', 'Oscorp Bio',           'Healthcare',    'France',  'Marseille',  900000.00,   75, 'lead'),
  ('b0000000-0000-0000-0000-000000000009', 'Soylent Corp',         'Food & Bev',    'France',  'Nantes',    4500000.00,  350, 'churned'),
  ('b0000000-0000-0000-0000-000000000010', 'Tyrell Consulting',    'Consulting',    'France',  'Nice',       600000.00,   40, 'active')
ON CONFLICT (id) DO NOTHING;

-- Contacts
INSERT INTO crm_contacts (id, customer_id, first_name, last_name, email, phone, role, is_primary) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Alice',   'Martin',   'alice.martin@acme.fr',       '+33 1 23 45 67 89', 'CTO',              true),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Bob',     'Dupont',   'bob.dupont@acme.fr',         '+33 1 23 45 67 90', 'VP Engineering',   false),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Claire',  'Bernard',  'claire.bernard@globex.fr',   '+33 4 56 78 90 12', 'CEO',              true),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'David',   'Leclerc',  'david.leclerc@initech.be',   '+32 2 345 67 89',   'Head of IT',       true),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'Emma',    'Moreau',   'emma.moreau@umbrella.fr',    '+33 5 67 89 01 23', 'CFO',              true),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', 'Frank',   'Weber',    'frank.weber@stark.de',       '+49 30 123 456 78', 'VP Product',       true),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006', 'Grace',   'Smith',    'grace.smith@wayne.co.uk',    '+44 20 7946 0958',  'Director of Ops',  true),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000007', 'Hugo',    'Petit',    'hugo.petit@cyberdyne.fr',    '+33 5 61 23 45 67', 'CTO',              true),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000008', 'Isabelle','Roux',     'isabelle.roux@oscorp.fr',    '+33 4 91 23 45 67', 'Lab Director',     true),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000009', 'Jean',    'Leroy',    'jean.leroy@soylent.fr',      '+33 2 40 12 34 56', 'COO',              true),
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000010', 'Karine',  'Fontaine', 'karine.fontaine@tyrell.fr',  '+33 4 93 12 34 56', 'Managing Partner', true)
ON CONFLICT (id) DO NOTHING;

-- Deals
INSERT INTO crm_deals (id, customer_id, contact_id, product_id, title, amount, stage, probability, close_date) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Acme CRM Migration',           15000.00, 'closed_won',   100, '2025-09-15'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Acme Analytics Upgrade',        8500.00, 'proposal',      60, '2026-03-01'),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Globex Premium Support',       24000.00, 'negotiation',   75, '2026-02-28'),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Initech Team Training',         6000.00, 'closed_won',   100, '2025-11-20'),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Umbrella Data Migration',      50000.00, 'qualification', 30, '2026-06-30'),
  ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Stark CRM Licenses x50',       14950.00, 'proposal',      50, '2026-04-15'),
  ('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'Wayne Enterprise Support',     48000.00, 'closed_won',   100, '2025-12-01'),
  ('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Cyberdyne Pilot',               5970.00, 'lead',          10, '2026-07-01'),
  ('d0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000004', 'Soylent Training Renewal',      3600.00, 'closed_lost',    0, '2025-08-01'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'Tyrell Analytics Setup',        4470.00, 'negotiation',   80, '2026-02-15')
ON CONFLICT (id) DO NOTHING;

-- Activities
INSERT INTO crm_activities (id, customer_id, contact_id, deal_id, type, subject, description, due_date, completed) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'meeting',  'Analytics demo with Acme',       'Present new dashboard features',          '2026-02-10', false),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'call',     'Negotiate Globex support terms',  'Discuss SLA and pricing options',          '2026-02-08', false),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'email',    'Send Umbrella migration proposal','Include timeline and cost breakdown',     '2026-02-07', true),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000006', 'meeting',  'Stark product demo',             'CRM Pro overview for VP Product',          '2026-02-14', false),
  ('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'note',     'Wayne kickoff completed',        'Support contract activated, SLA in place', '2025-12-02', true),
  ('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000008', 'task',     'Prepare Cyberdyne POC env',      'Spin up sandbox with test data',           '2026-03-01', false),
  ('e0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'email',    'Send Initech training materials','Post-training follow-up resources',        '2025-11-25', true),
  ('e0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000010', 'call',     'Tyrell final negotiation',       'Finalize pricing and onboarding schedule', '2026-02-12', false),
  ('e0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL,                                   'task',     'Quarterly review with Acme',     'Prepare QBR deck with usage metrics',      '2026-03-15', false),
  ('e0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000009', NULL,                                   'email',    'Oscorp intro email',             'Initial outreach about CRM solutions',     '2026-02-09', false)
ON CONFLICT (id) DO NOTHING;

-- Stock Items Table
CREATE TABLE IF NOT EXISTS stock_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  category VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'adet',
  current_quantity DECIMAL(10,2) DEFAULT 0,
  min_quantity DECIMAL(10,2) DEFAULT 0,
  max_quantity DECIMAL(10,2),
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  supplier VARCHAR(255),
  last_restocked TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for venue queries
CREATE INDEX IF NOT EXISTS idx_stock_items_venue ON stock_items(venue_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_active ON stock_items(is_active);

-- RLS Policies
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stock items of their venues" ON stock_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert stock items" ON stock_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update stock items" ON stock_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete stock items" ON stock_items
  FOR DELETE USING (true);

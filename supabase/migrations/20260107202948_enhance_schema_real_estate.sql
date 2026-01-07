/*
  # Enhanced ERP Schema for Real Estate Investment Company

  1. New Enhancements:
    - Real estate units (شقةs, فيلاs, ارض)
    - Unit status tracking (Available, Reserved, Sold)
    - Sales contracts with financial terms
    - Installment plans
    - Payment tracking with late penalties
    - Goods receipt/issue notes for inventory
    - Warehouse transfers
    - Project profitability tracking
    - Role-based access control

  2. New Tables:
    - user_roles: RBAC system
    - real_estate_units: شقةs, فيلاs, ارض properties
    - unit_features: Specifications for units
    - sales_contracts: Contracts for unit sales
    - installment_plans: Payment schedules
    - unit_payments: Payment records with penalties
    - goods_receipt_notes: Material receipts
    - goods_issue_notes: Material issues
    - warehouse_transfers: Inter-warehouse movements
    - project_profitability: Cost and revenue summary

  3. Security:
    - RLS on all new tables
    - Role-based access control
*/

-- ============= USER ROLES & ACCESS CONTROL =============
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('Admin', 'HR', 'Sales', 'Warehouse', 'Finance')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============= REAL ESTATE UNITS =============
CREATE TABLE IF NOT EXISTS real_estate_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id uuid REFERENCES real_estate_projects(id),
  unit_code text NOT NULL,
  unit_name text NOT NULL,
  unit_type text NOT NULL CHECK (unit_type IN ('شقة', 'فيلا', 'ارض')),
  location text,
  area_sqm decimal(10, 2),
  bedrooms integer,
  bathrooms integer,
  price decimal(14, 2) NOT NULL,
  status text DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'Sold')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, unit_code)
);

ALTER TABLE real_estate_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage units"
  ON real_estate_units FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = real_estate_units.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = real_estate_units.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= UNIT FEATURES =============
CREATE TABLE IF NOT EXISTS unit_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES real_estate_units(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  feature_value text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE unit_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage unit features"
  ON unit_features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN real_estate_units ON companies.id = real_estate_units.company_id
      WHERE real_estate_units.id = unit_features.unit_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN real_estate_units ON companies.id = real_estate_units.company_id
      WHERE real_estate_units.id = unit_features.unit_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= SALES CONTRACTS =============
CREATE TABLE IF NOT EXISTS sales_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES real_estate_units(id) ON DELETE RESTRICT,
  contract_number text NOT NULL,
  contract_date date NOT NULL,
  unit_price decimal(14, 2) NOT NULL,
  down_payment_percent decimal(5, 2) NOT NULL DEFAULT 20,
  down_payment_amount decimal(14, 2) NOT NULL,
  remaining_amount decimal(14, 2) NOT NULL,
  contract_status text DEFAULT 'Active' CHECK (contract_status IN ('Draft', 'Active', 'Completed', 'Cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, contract_number)
);

ALTER TABLE sales_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage contracts"
  ON sales_contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = sales_contracts.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = sales_contracts.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= INSTALLMENT PLANS =============
CREATE TABLE IF NOT EXISTS installment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES sales_contracts(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount decimal(14, 2) NOT NULL,
  paid_amount decimal(14, 2) DEFAULT 0,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(contract_id, installment_number)
);

ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage installments"
  ON installment_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN sales_contracts ON companies.id = sales_contracts.company_id
      WHERE sales_contracts.id = installment_plans.contract_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN sales_contracts ON companies.id = sales_contracts.company_id
      WHERE sales_contracts.id = installment_plans.contract_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= UNIT PAYMENTS =============
CREATE TABLE IF NOT EXISTS unit_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id uuid NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  amount decimal(14, 2) NOT NULL,
  payment_method text CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Check')),
  late_penalty decimal(14, 2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE unit_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage unit payments"
  ON unit_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN sales_contracts ON companies.id = sales_contracts.company_id
      JOIN installment_plans ON sales_contracts.id = installment_plans.contract_id
      WHERE installment_plans.id = unit_payments.installment_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN sales_contracts ON companies.id = sales_contracts.company_id
      JOIN installment_plans ON sales_contracts.id = installment_plans.contract_id
      WHERE installment_plans.id = unit_payments.installment_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= GOODS RECEIPT NOTES =============
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  supplier_id uuid REFERENCES suppliers(id),
  grn_number text NOT NULL,
  grn_date date NOT NULL,
  po_reference text,
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Received', 'Verified')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, grn_number)
);

ALTER TABLE goods_receipt_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage GRNs"
  ON goods_receipt_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = goods_receipt_notes.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = goods_receipt_notes.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= GRN ITEMS =============
CREATE TABLE IF NOT EXISTS grn_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id uuid NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id),
  quantity_ordered integer NOT NULL,
  quantity_received integer NOT NULL,
  unit_price decimal(12, 2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage GRN items"
  ON grn_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN goods_receipt_notes ON companies.id = goods_receipt_notes.company_id
      WHERE goods_receipt_notes.id = grn_items.grn_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN goods_receipt_notes ON companies.id = goods_receipt_notes.company_id
      WHERE goods_receipt_notes.id = grn_items.grn_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= GOODS ISSUE NOTES =============
CREATE TABLE IF NOT EXISTS goods_issue_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  project_id uuid REFERENCES real_estate_projects(id),
  gin_number text NOT NULL,
  gin_date date NOT NULL,
  issued_to text,
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Issued', 'Received')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, gin_number)
);

ALTER TABLE goods_issue_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage GINs"
  ON goods_issue_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = goods_issue_notes.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = goods_issue_notes.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= GIN ITEMS =============
CREATE TABLE IF NOT EXISTS gin_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gin_id uuid NOT NULL REFERENCES goods_issue_notes(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id),
  quantity_issued integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gin_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage GIN items"
  ON gin_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN goods_issue_notes ON companies.id = goods_issue_notes.company_id
      WHERE goods_issue_notes.id = gin_items.gin_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN goods_issue_notes ON companies.id = goods_issue_notes.company_id
      WHERE goods_issue_notes.id = gin_items.gin_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= WAREHOUSE TRANSFERS =============
CREATE TABLE IF NOT EXISTS warehouse_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  from_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  to_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  transfer_number text NOT NULL,
  transfer_date date NOT NULL,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Transit', 'Received')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, transfer_number)
);

ALTER TABLE warehouse_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage transfers"
  ON warehouse_transfers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = warehouse_transfers.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = warehouse_transfers.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= TRANSFER ITEMS =============
CREATE TABLE IF NOT EXISTS transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id),
  quantity integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage transfer items"
  ON transfer_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN warehouse_transfers ON companies.id = warehouse_transfers.company_id
      WHERE warehouse_transfers.id = transfer_items.transfer_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN warehouse_transfers ON companies.id = warehouse_transfers.company_id
      WHERE warehouse_transfers.id = transfer_items.transfer_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= PROJECT PROFITABILITY =============
CREATE TABLE IF NOT EXISTS project_profitability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES real_estate_projects(id) ON DELETE CASCADE,
  total_units integer DEFAULT 0,
  units_sold integer DEFAULT 0,
  total_revenue decimal(14, 2) DEFAULT 0,
  total_costs decimal(14, 2) DEFAULT 0,
  gross_profit decimal(14, 2) DEFAULT 0,
  profit_margin decimal(5, 2) DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id)
);

ALTER TABLE project_profitability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view profitability"
  ON project_profitability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN real_estate_projects ON companies.id = real_estate_projects.company_id
      WHERE real_estate_projects.id = project_profitability.project_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= INDEXES =============
CREATE INDEX IF NOT EXISTS idx_real_estate_units_project ON real_estate_units(project_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_units_status ON real_estate_units(status);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_customer ON sales_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_unit ON sales_contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_contract ON installment_plans(contract_id);
CREATE INDEX IF NOT EXISTS idx_grn_warehouse ON goods_receipt_notes(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_gin_warehouse ON goods_issue_notes(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_gin_project ON goods_issue_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_from ON warehouse_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_to ON warehouse_transfers(to_warehouse_id);
/*
  # Create Core ERP Tables

  1. Companies & Settings
    - Company information for multi-company support
  2. Human Resources (HR)
    - Employees, Attendance, Leaves, Payroll, Social Insurance
  3. Suppliers & Contractors
    - Suppliers, Contractors, Purchase Invoices, Contracts, Payments
  4. Customers & Sales
    - Customers, Sales Invoices, Payments
  5. Inventory
    - Warehouses, Inventory Items, Stock Movements
  6. Real Estate Projects
    - Projects, Project Details, Project Costs
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= COMPANIES & SETTINGS =============
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  registration_number text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their companies"
  ON companies FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ============= HUMAN RESOURCES =============
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  national_id text,
  date_of_birth date,
  joining_date date NOT NULL,
  resignation_date date,
  termination_date date,
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Resigned', 'Terminated', 'Suspended')),
  position text,
  department text,
  salary decimal(12, 2),
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage employees"
  ON employees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = employees.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = employees.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  check_in_time time,
  check_out_time time,
  status text DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Late', 'Half Day')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, attendance_date)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage attendance"
  ON attendance_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      JOIN companies ON companies.id = employees.company_id
      WHERE employees.id = attendance_records.employee_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      JOIN companies ON companies.id = employees.company_id
      WHERE employees.id = attendance_records.employee_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  days_per_year integer NOT NULL,
  is_paid boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage leave types"
  ON leave_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = leave_types.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = leave_types.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  number_of_days integer NOT NULL,
  reason text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage leaves"
  ON leave_applications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      JOIN companies ON companies.id = employees.company_id
      WHERE employees.id = leave_applications.employee_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      JOIN companies ON companies.id = employees.company_id
      WHERE employees.id = leave_applications.employee_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS social_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  insurance_number text,
  employee_percentage decimal(5, 2) DEFAULT 0,
  company_percentage decimal(5, 2) DEFAULT 0,
  effective_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, effective_date)
);

ALTER TABLE social_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage social insurance"
  ON social_insurance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      JOIN companies ON companies.id = employees.company_id
      WHERE employees.id = social_insurance.employee_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      JOIN companies ON companies.id = employees.company_id
      WHERE employees.id = social_insurance.employee_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  base_salary decimal(12, 2) NOT NULL,
  overtime_hours decimal(6, 2) DEFAULT 0,
  overtime_amount decimal(12, 2) DEFAULT 0,
  bonuses decimal(12, 2) DEFAULT 0,
  deductions decimal(12, 2) DEFAULT 0,
  social_insurance_employee decimal(12, 2) DEFAULT 0,
  social_insurance_company decimal(12, 2) DEFAULT 0,
  net_salary decimal(12, 2) NOT NULL,
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Calculated', 'Approved', 'Paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, pay_period_start)
);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage payroll"
  ON payroll FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      JOIN companies ON companies.id = employees.company_id
      WHERE employees.id = payroll.employee_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      JOIN companies ON companies.id = employees.company_id
      WHERE employees.id = payroll.employee_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS employee_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  settlement_date date NOT NULL,
  final_settlement_amount decimal(12, 2) NOT NULL,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Paid')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage settlements"
  ON employee_settlements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      JOIN companies ON companies.id = employees.company_id
      WHERE employees.id = employee_settlements.employee_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      JOIN companies ON companies.id = employees.company_id
      WHERE employees.id = employee_settlements.employee_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= SUPPLIERS & CONTRACTORS =============
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  classification text NOT NULL CHECK (classification IN ('Materials', 'Services')),
  contact_person text,
  email text,
  phone text,
  address text,
  tax_id text,
  payment_terms text,
  currency text DEFAULT 'USD',
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = suppliers.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = suppliers.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  license_number text,
  insurance_info text,
  currency text DEFAULT 'USD',
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Blacklisted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage contractors"
  ON contractors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = contractors.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = contractors.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  amount decimal(12, 2) NOT NULL,
  paid_amount decimal(12, 2) DEFAULT 0,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Paid')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, invoice_number)
);

ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage purchase invoices"
  ON purchase_invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = purchase_invoices.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = purchase_invoices.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS contractor_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE RESTRICT,
  project_id uuid,
  contract_number text NOT NULL,
  contract_date date NOT NULL,
  contract_amount decimal(12, 2) NOT NULL,
  contract_currency text DEFAULT 'USD',
  scope_of_work text,
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, contract_number)
);

ALTER TABLE contractor_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage contracts"
  ON contractor_contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = contractor_contracts.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = contractor_contracts.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS contractor_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES contractor_contracts(id) ON DELETE CASCADE,
  statement_date date NOT NULL,
  progress_percentage integer,
  amount_claimed decimal(12, 2) NOT NULL,
  amount_paid decimal(12, 2) DEFAULT 0,
  status text DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Approved', 'Partial Payment', 'Paid')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractor_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage contractor statements"
  ON contractor_statements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN contractor_contracts ON companies.id = contractor_contracts.company_id
      WHERE contractor_contracts.id = contractor_statements.contract_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN contractor_contracts ON companies.id = contractor_contracts.company_id
      WHERE contractor_contracts.id = contractor_statements.contract_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  payment_amount decimal(12, 2) NOT NULL,
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage supplier payments"
  ON supplier_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN purchase_invoices ON companies.id = purchase_invoices.company_id
      WHERE purchase_invoices.id = supplier_payments.invoice_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN purchase_invoices ON companies.id = purchase_invoices.company_id
      WHERE purchase_invoices.id = supplier_payments.invoice_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= CUSTOMERS & SALES =============
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  tax_id text,
  currency text DEFAULT 'USD',
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = customers.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = customers.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  amount decimal(12, 2) NOT NULL,
  paid_amount decimal(12, 2) DEFAULT 0,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Paid', 'Overdue')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, invoice_number)
);

ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage sales invoices"
  ON sales_invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = sales_invoices.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = sales_invoices.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS customer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  payment_amount decimal(12, 2) NOT NULL,
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage customer payments"
  ON customer_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN sales_invoices ON companies.id = sales_invoices.company_id
      WHERE sales_invoices.id = customer_payments.invoice_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN sales_invoices ON companies.id = sales_invoices.company_id
      WHERE sales_invoices.id = customer_payments.invoice_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= INVENTORY =============
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text NOT NULL,
  manager_name text,
  contact_phone text,
  capacity_tons decimal(10, 2),
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage warehouses"
  ON warehouses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = warehouses.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = warehouses.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  item_code text NOT NULL,
  item_name text NOT NULL,
  item_type text,
  quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL,
  unit_cost decimal(12, 2),
  reorder_level integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(warehouse_id, item_code)
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage inventory"
  ON inventory_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = inventory_items.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = inventory_items.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_date date NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('In', 'Out', 'Adjustment')),
  quantity integer NOT NULL,
  reason text,
  reference_document text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage stock movements"
  ON stock_movements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN inventory_items ON companies.id = inventory_items.company_id
      WHERE inventory_items.id = stock_movements.inventory_item_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN inventory_items ON companies.id = inventory_items.company_id
      WHERE inventory_items.id = stock_movements.inventory_item_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= REAL ESTATE PROJECTS =============
CREATE TABLE IF NOT EXISTS real_estate_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_code text NOT NULL,
  project_name text NOT NULL,
  description text,
  location text,
  project_type text,
  status text DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled')),
  start_date date,
  expected_completion_date date,
  actual_completion_date date,
  total_budget decimal(14, 2),
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, project_code)
);

ALTER TABLE real_estate_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage real estate projects"
  ON real_estate_projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = real_estate_projects.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = real_estate_projects.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS project_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES real_estate_projects(id) ON DELETE CASCADE,
  phase_name text NOT NULL,
  phase_number integer NOT NULL,
  start_date date,
  end_date date,
  budget decimal(12, 2),
  status text DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Completed')),
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, phase_number)
);

ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage project phases"
  ON project_phases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN real_estate_projects ON companies.id = real_estate_projects.company_id
      WHERE real_estate_projects.id = project_phases.project_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN real_estate_projects ON companies.id = real_estate_projects.company_id
      WHERE real_estate_projects.id = project_phases.project_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS project_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES real_estate_projects(id) ON DELETE CASCADE,
  cost_category text NOT NULL,
  cost_description text,
  estimated_cost decimal(12, 2) NOT NULL,
  actual_cost decimal(12, 2) DEFAULT 0,
  contractor_id uuid REFERENCES contractors(id),
  supplier_id uuid REFERENCES suppliers(id),
  cost_date date,
  status text DEFAULT 'Estimated' CHECK (status IN ('Estimated', 'Incurred', 'Paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage project costs"
  ON project_costs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN real_estate_projects ON companies.id = real_estate_projects.company_id
      WHERE real_estate_projects.id = project_costs.project_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN real_estate_projects ON companies.id = real_estate_projects.company_id
      WHERE real_estate_projects.id = project_costs.project_id
      AND companies.owner_id = auth.uid()
    )
  );

-- ============= CREATE INDEXES =============
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll(employee_id, pay_period_start);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_contractors_company ON contractors(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_contractor_contracts_contractor ON contractor_contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_company ON warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory_items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_projects_company ON real_estate_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_project ON project_costs(project_id);
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'INVESTOR',
    "phone" TEXT,
    "avatar_url" TEXT,
    "cpf_cnpj" TEXT,
    "rg" TEXT,
    "address" TEXT,
    "bank_details" TEXT,
    "bank_references" TEXT,
    "commercial_refs" TEXT,
    "profession" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "investment_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "initial_capital" REAL NOT NULL,
    "max_cycles" INTEGER NOT NULL DEFAULT 8,
    "profit_split_pct" REAL NOT NULL DEFAULT 0.50,
    "notes" TEXT,
    "contract_number" TEXT,
    "start_date" DATETIME,
    "bank_account" TEXT,
    "pix_key" TEXT,
    "payout_rule" TEXT DEFAULT 'REINVEST',
    "tax_profile" TEXT DEFAULT 'PF',
    "created_by_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "investment_projects_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "investment_projects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "import_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_code" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "country_origin" TEXT NOT NULL,
    "purchase_date" DATETIME NOT NULL,
    "expected_shipment_date" DATETIME,
    "expected_nationality_date" DATETIME,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchange_rate" REAL NOT NULL,
    "fob_value" REAL NOT NULL,
    "freight" REAL NOT NULL,
    "insurance" REAL NOT NULL,
    "customs_taxes" REAL NOT NULL,
    "customs_fees" REAL NOT NULL,
    "total_cost_nationalized" REAL NOT NULL,
    "quantity_items" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CAPTACAO',
    "expected_margin_pct" REAL NOT NULL,
    "realized_margin_pct" REAL,
    "investment_project_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "import_lots_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "import_lots_investment_project_id_fkey" FOREIGN KEY ("investment_project_id") REFERENCES "investment_projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "commercial_name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "caliber" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "barrel_length" REAL NOT NULL,
    "finish" TEXT NOT NULL,
    "origin_country" TEXT NOT NULL,
    "ncm" TEXT NOT NULL,
    "technical_description" TEXT,
    "photos" TEXT,
    "videos" TEXT,
    "price_b2c" REAL NOT NULL,
    "price_b2b" REAL,
    "stock_available" INTEGER NOT NULL DEFAULT 0,
    "stock_reserved" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "import_lot_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "products_import_lot_id_fkey" FOREIGN KEY ("import_lot_id") REFERENCES "import_lots" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weapons_map" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "classification" TEXT,
    "supplier_id" TEXT NOT NULL,
    "import_lot_id" TEXT NOT NULL,
    "import_process_number" TEXT,
    "li_number" TEXT,
    "di_number" TEXT,
    "di_date" DATETIME,
    "customs_clearance_date" DATETIME,
    "entry_invoice_number" TEXT,
    "entry_date" DATETIME NOT NULL,
    "unit_cost" REAL NOT NULL,
    "warehouse_location" TEXT,
    "current_status" TEXT NOT NULL DEFAULT 'IMPORTADA',
    "last_movement_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observations" TEXT,
    "has_divergence" BOOLEAN NOT NULL DEFAULT false,
    "customer_id" TEXT,
    "customer_cpf_cnpj" TEXT,
    "customer_state" TEXT,
    "sales_order_id" TEXT,
    "sales_invoice_number" TEXT,
    "sale_date" DATETIME,
    "sale_value" REAL,
    "payment_method" TEXT,
    "shipping_company" TEXT,
    "delivery_status" TEXT,
    "checked_by_id" TEXT,
    "selling_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "weapons_map_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "weapons_map_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "weapons_map_import_lot_id_fkey" FOREIGN KEY ("import_lot_id") REFERENCES "import_lots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "weapons_map_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "weapons_map_checked_by_id_fkey" FOREIGN KEY ("checked_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "weapons_map_selling_user_id_fkey" FOREIGN KEY ("selling_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "weapons_map_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "cycle_number" INTEGER NOT NULL,
    "cycle_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "import_lot_id" TEXT,
    "process_number" TEXT,
    "di_number" TEXT,
    "di_date" DATETIME,
    "quantity" INTEGER NOT NULL,
    "sale_price_per_unit" REAL NOT NULL,
    "exchange_rate_usd" REAL NOT NULL,
    "fob_value_usd" REAL NOT NULL,
    "freight_usd" REAL NOT NULL,
    "insurance_usd" REAL NOT NULL,
    "customs_value_brl" REAL NOT NULL,
    "ii_tax" REAL NOT NULL,
    "ipi_tax" REAL NOT NULL,
    "afrmm_tax" REAL NOT NULL,
    "capatazia" REAL NOT NULL,
    "pis_pasep_tax" REAL NOT NULL,
    "cofins_tax" REAL NOT NULL,
    "siscomex_fee" REAL NOT NULL,
    "icms_st" REAL NOT NULL,
    "simples_tax" REAL NOT NULL,
    "operational_cost" REAL NOT NULL,
    "calc_base_normal" REAL NOT NULL,
    "icms_base_altered" REAL NOT NULL,
    "icms_import_tax" REAL NOT NULL,
    "total_investment" REAL NOT NULL,
    "gross_revenue" REAL NOT NULL,
    "sales_tax" REAL NOT NULL,
    "sales_operational_cost" REAL NOT NULL,
    "net_revenue" REAL NOT NULL,
    "gross_profit" REAL NOT NULL,
    "investor_share" REAL NOT NULL,
    "company_share" REAL NOT NULL,
    "reserve_share" REAL NOT NULL,
    "reinvestment_share" REAL NOT NULL,
    "tax_snapshot" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cycles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "investment_projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cycles_import_lot_id_fkey" FOREIGN KEY ("import_lot_id") REFERENCES "import_lots" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "bank_details" TEXT,
    "rating" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'B2B',
    "name" TEXT NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "address_number" TEXT,
    "address_complement" TEXT,
    "neighborhood" TEXT,
    "cep" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "cr_number" TEXT,
    "category" TEXT,
    "rg" TEXT,
    "birth_date" DATETIME,
    "cr_validity_date" DATETIME,
    "source" TEXT,
    "notes" TEXT,
    "fantasy_name" TEXT,
    "state_registration" TEXT,
    "responsible_name" TEXT,
    "store_email" TEXT,
    "seller_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "customers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "total_value" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "proposed_date" DATETIME,
    "payment_method" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_number" TEXT NOT NULL,
    "invoice_series" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "sales_order_id" TEXT,
    "emission_date" DATETIME NOT NULL,
    "products" TEXT NOT NULL,
    "total_amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "nfe_key" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_distribution_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "reinvestment_pct" REAL NOT NULL,
    "investor_pct" REAL NOT NULL,
    "company_pct" REAL NOT NULL,
    "reserve_pct" REAL NOT NULL,
    "operational_cost" REAL NOT NULL,
    "sales_commission" REAL NOT NULL,
    "min_balance_new_purchase" REAL NOT NULL,
    "new_batch_criteria" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "value" REAL NOT NULL DEFAULT 0,
    "source" TEXT,
    "assigned_seller_id" TEXT,
    "interests" TEXT,
    "documents" TEXT,
    "notes" TEXT,
    "tax_id" TEXT,
    "state" TEXT,
    "city" TEXT,
    "customer_type" TEXT,
    "document_status" TEXT,
    "category" TEXT,
    "cr_number" TEXT,
    "cr_validity" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leads_assigned_seller_id_fkey" FOREIGN KEY ("assigned_seller_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lead_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lead_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user" TEXT NOT NULL DEFAULT 'Sistema',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "base64Data" TEXT NOT NULL,
    "project_id" TEXT,
    "customer_id" TEXT,
    "lot_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "investment_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "documents_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "import_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tax_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ii" REAL NOT NULL,
    "ipi" REAL NOT NULL,
    "pis_pasep" REAL NOT NULL,
    "cofins" REAL NOT NULL,
    "icms_import" REAL NOT NULL,
    "icms_sale" REAL NOT NULL,
    "simples_nacional" REAL NOT NULL,
    "siscomex_fixed" REAL NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "import_lots_batch_code_key" ON "import_lots"("batch_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "weapons_map_serial_number_key" ON "weapons_map"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "customers_cpf_cnpj_key" ON "customers"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_order_number_key" ON "sales_orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");


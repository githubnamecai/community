-- 小区/楼栋表
CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  floors INTEGER DEFAULT 1,
  units_per_floor INTEGER DEFAULT 4,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 房屋/单元表
CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id INTEGER NOT NULL,
  unit_number TEXT NOT NULL,
  floor INTEGER,
  area REAL DEFAULT 0,
  unit_type TEXT DEFAULT '住宅',
  status TEXT DEFAULT '已入住',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- 业主表
CREATE TABLE IF NOT EXISTS owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  id_card TEXT,
  unit_id INTEGER,
  move_in_date TEXT,
  status TEXT DEFAULT '在住',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- 费用类型表
CREATE TABLE IF NOT EXISTS fee_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unit_price REAL DEFAULT 0,
  unit_label TEXT DEFAULT '元/月',
  description TEXT
);

-- 费用账单表
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL,
  owner_id INTEGER,
  fee_type_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  bill_month TEXT NOT NULL,
  status TEXT DEFAULT '未缴',
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (owner_id) REFERENCES owners(id),
  FOREIGN KEY (fee_type_id) REFERENCES fee_types(id)
);

-- 报修工单表
CREATE TABLE IF NOT EXISTS repairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER,
  owner_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT '公共设施',
  priority TEXT DEFAULT '普通',
  status TEXT DEFAULT '待处理',
  assigned_to TEXT,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (owner_id) REFERENCES owners(id)
);

-- 公告表
CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT '通知',
  is_top INTEGER DEFAULT 0,
  status TEXT DEFAULT '已发布',
  publish_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_units_building ON units(building_id);
CREATE INDEX IF NOT EXISTS idx_owners_unit ON owners(unit_id);
CREATE INDEX IF NOT EXISTS idx_bills_unit ON bills(unit_id);
CREATE INDEX IF NOT EXISTS idx_bills_month ON bills(bill_month);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_notices_status ON notices(status);

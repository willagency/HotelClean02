-- ============================================================
-- Hotel Cleaning Management System - Database Schema
-- ============================================================

-- 1. ホテルマスタ
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 役割マスタ
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hourly_wage INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 部屋タイプマスタ
CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. スタッフマスタ
CREATE TABLE staffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 勤怠トランザクション
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staffs(id),
  hotel_id UUID NOT NULL REFERENCES hotels(id),
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. シフトトランザクション
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staffs(id),
  hotel_id UUID NOT NULL REFERENCES hotels(id),
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

-- 7. 清掃実績集計（日報）
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id),
  date DATE NOT NULL,
  room_type_id UUID NOT NULL REFERENCES room_types(id),
  completed_rooms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, date, room_type_id)
);

-- 8. 売上調整金
CREATE TABLE adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id),
  date DATE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) - 基本設定
-- ============================================================
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjustments ENABLE ROW LEVEL SECURITY;

-- MVP: 認証済みユーザーは全操作可能（後で権限を細分化）
CREATE POLICY "authenticated_all" ON hotels FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON roles FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON room_types FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON staffs FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON attendances FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON shifts FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON daily_reports FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON adjustments FOR ALL TO authenticated USING (true);

-- ============================================================
-- Seed Data（開発用）
-- ============================================================
INSERT INTO hotels (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ホテルサンプルA'),
  ('00000000-0000-0000-0000-000000000002', 'ホテルサンプルB');

INSERT INTO roles (id, name, hourly_wage) VALUES
  ('00000000-0000-0000-0000-000000000010', 'リーダー', 1500),
  ('00000000-0000-0000-0000-000000000011', 'スタッフ', 1200);

INSERT INTO room_types (id, hotel_id, name, unit_price) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'シングル', 800),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'ダブル', 1200),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'スイート', 2500),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000002', 'スタンダード', 900),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000002', 'デラックス', 1400);

INSERT INTO staffs (id, name, role_id) VALUES
  ('00000000-0000-0000-0000-000000000030', '田中 花子', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000031', '佐藤 太郎', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000032', '山田 次郎', '00000000-0000-0000-0000-000000000011');

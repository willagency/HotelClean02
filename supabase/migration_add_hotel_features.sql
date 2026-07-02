-- ============================================================
-- Migration: ホテル登録機能 + 権限別RLS
-- 実行前に: supabase/schema.sql が適用済みであること
-- ============================================================

-- ① hotels テーブルに月間目標売上カラムを追加
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS monthly_target_sales INTEGER NOT NULL DEFAULT 0;

-- ② 既存の汎用ポリシーを削除し、役割別に再定義
--    (RLSは有効化済みなので ALTER TABLE ... ENABLE は不要)

DROP POLICY IF EXISTS "authenticated_all" ON hotels;
DROP POLICY IF EXISTS "hotels_select_admin_leader" ON hotels;
DROP POLICY IF EXISTS "hotels_insert_admin_only"   ON hotels;
DROP POLICY IF EXISTS "hotels_update_admin_only"   ON hotels;
DROP POLICY IF EXISTS "hotels_delete_admin_only"   ON hotels;

-- SELECT: 管理者 + リーダーが閲覧可
CREATE POLICY "hotels_select_admin_leader"
  ON hotels FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'leader')
  );

-- INSERT: 管理者のみ
CREATE POLICY "hotels_insert_admin_only"
  ON hotels FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- UPDATE: 管理者のみ
CREATE POLICY "hotels_update_admin_only"
  ON hotels FOR UPDATE TO authenticated
  USING     ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- DELETE: 管理者のみ
CREATE POLICY "hotels_delete_admin_only"
  ON hotels FOR DELETE TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ③ room_types も同様に権限別ポリシーへ差し替え
DROP POLICY IF EXISTS "authenticated_all"         ON room_types;
DROP POLICY IF EXISTS "room_types_select_admin_leader" ON room_types;
DROP POLICY IF EXISTS "room_types_write_admin_only"    ON room_types;
DROP POLICY IF EXISTS "room_types_update_admin_only"   ON room_types;

CREATE POLICY "room_types_select_admin_leader"
  ON room_types FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'leader')
  );

CREATE POLICY "room_types_insert_admin_only"
  ON room_types FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "room_types_update_admin_only"
  ON room_types FOR UPDATE TO authenticated
  USING     ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "room_types_delete_admin_only"
  ON room_types FOR DELETE TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- Seed / 既存レコードの monthly_target_sales 更新
-- ============================================================

-- 既存のサンプルデータに目標売上を設定
UPDATE hotels SET monthly_target_sales = 1500000
  WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE hotels SET monthly_target_sales = 800000
  WHERE id = '00000000-0000-0000-0000-000000000002';

-- 新しいサンプルデータ（既に存在する場合はスキップ）
INSERT INTO hotels (name, monthly_target_sales) VALUES
  ('コテージ・フラミンゴ',          600000),
  ('天成園 小田原駅 別館',         2200000),
  ('ビジネスホテル SAKURA',         900000),
  ('リゾート白浜 オーシャンビュー', 3500000),
  ('アパホテル〈新宿三丁目〉',      1200000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Supabase Auth ユーザーへの role 設定メモ
-- ============================================================
-- Supabase ダッシュボード > Authentication > Users
-- 対象ユーザーを選択 > Edit > Raw user_metadata に以下を設定:
--
-- 管理者:  { "role": "admin"  }
-- リーダー: { "role": "leader" }
-- スタッフ: { "role": "staff"  }
--
-- または SQL で:
-- UPDATE auth.users
--   SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'
--   WHERE email = 'admin@example.com';

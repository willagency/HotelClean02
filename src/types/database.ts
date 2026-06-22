export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      hotels: {
        Row: {
          id: string
          name: string
          monthly_target_sales: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          monthly_target_sales?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          monthly_target_sales?: number
          created_at?: string
        }
      }
      roles: {
        Row: { id: string; name: string; hourly_wage: number; created_at: string }
        Insert: { id?: string; name: string; hourly_wage: number; created_at?: string }
        Update: { id?: string; name?: string; hourly_wage?: number; created_at?: string }
      }
      room_types: {
        Row: { id: string; hotel_id: string; name: string; unit_price: number; created_at: string }
        Insert: { id?: string; hotel_id: string; name: string; unit_price: number; created_at?: string }
        Update: { id?: string; hotel_id?: string; name?: string; unit_price?: number; created_at?: string }
      }
      staffs: {
        Row: { id: string; name: string; role_id: string | null; created_at: string }
        Insert: { id?: string; name: string; role_id?: string | null; created_at?: string }
        Update: { id?: string; name?: string; role_id?: string | null; created_at?: string }
      }
      attendances: {
        Row: {
          id: string; staff_id: string; hotel_id: string
          clock_in: string; clock_out: string | null
          break_minutes: number; created_at: string
        }
        Insert: {
          id?: string; staff_id: string; hotel_id: string
          clock_in: string; clock_out?: string | null
          break_minutes?: number; created_at?: string
        }
        Update: {
          id?: string; staff_id?: string; hotel_id?: string
          clock_in?: string; clock_out?: string | null
          break_minutes?: number; created_at?: string
        }
      }
      shifts: {
        Row: {
          id: string; staff_id: string; hotel_id: string
          date: string; status: 'requested' | 'approved' | 'rejected'; created_at: string
        }
        Insert: {
          id?: string; staff_id: string; hotel_id: string
          date: string; status?: 'requested' | 'approved' | 'rejected'; created_at?: string
        }
        Update: {
          id?: string; staff_id?: string; hotel_id?: string
          date?: string; status?: 'requested' | 'approved' | 'rejected'; created_at?: string
        }
      }
      daily_reports: {
        Row: {
          id: string; hotel_id: string; date: string
          room_type_id: string; completed_rooms: number; created_at: string
        }
        Insert: {
          id?: string; hotel_id: string; date: string
          room_type_id: string; completed_rooms: number; created_at?: string
        }
        Update: {
          id?: string; hotel_id?: string; date?: string
          room_type_id?: string; completed_rooms?: number; created_at?: string
        }
      }
      adjustments: {
        Row: {
          id: string; hotel_id: string; date: string
          amount: number; reason: string | null; created_at: string
        }
        Insert: {
          id?: string; hotel_id: string; date: string
          amount: number; reason?: string | null; created_at?: string
        }
        Update: {
          id?: string; hotel_id?: string; date?: string
          amount?: number; reason?: string | null; created_at?: string
        }
      }
    }
  }
}

// ── 基本エイリアス ──────────────────────────────────────────────
export type Hotel      = Database['public']['Tables']['hotels']['Row']
export type Role       = Database['public']['Tables']['roles']['Row']
export type RoomType   = Database['public']['Tables']['room_types']['Row']
export type Staff      = Database['public']['Tables']['staffs']['Row']
export type Attendance = Database['public']['Tables']['attendances']['Row']
export type Shift      = Database['public']['Tables']['shifts']['Row']
export type DailyReport = Database['public']['Tables']['daily_reports']['Row']
export type Adjustment = Database['public']['Tables']['adjustments']['Row']

// ── JOIN拡張型 ─────────────────────────────────────────────────
export type StaffWithRole       = Staff      & { roles: Role | null }
export type RoomTypeWithHotel   = RoomType   & { hotels: Hotel }
export type AttendanceWithStaff = Attendance & { staffs: StaffWithRole; hotels: Hotel }
export type ShiftWithDetails    = Shift      & { staffs: Staff; hotels: Hotel }
export type HotelWithRoomTypes  = Hotel      & { room_types: RoomType[] }

// ── 権限型 ────────────────────────────────────────────────────
export type UserRole = 'admin' | 'leader' | 'staff'

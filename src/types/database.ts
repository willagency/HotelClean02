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
        Relationships: []
      }
      roles: {
        Row: { id: string; name: string; hourly_wage: number; created_at: string }
        Insert: { id?: string; name: string; hourly_wage: number; created_at?: string }
        Update: { id?: string; name?: string; hourly_wage?: number; created_at?: string }
        Relationships: []
      }
      room_types: {
        Row: { id: string; hotel_id: string; name: string; unit_price: number; created_at: string }
        Insert: { id?: string; hotel_id: string; name: string; unit_price: number; created_at?: string }
        Update: { id?: string; hotel_id?: string; name?: string; unit_price?: number; created_at?: string }
        Relationships: [
          {
            foreignKeyName: "room_types_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          }
        ]
      }
      staffs: {
        Row: { id: string; name: string; role_id: string | null; created_at: string }
        Insert: { id?: string; name: string; role_id?: string | null; created_at?: string }
        Update: { id?: string; name?: string; role_id?: string | null; created_at?: string }
        Relationships: [
          {
            foreignKeyName: "staffs_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "attendances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "daily_reports_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "adjustments_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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

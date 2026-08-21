// Rispecchia schema.sql. Rigenerabile con:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types.ts

export type EventCat = 'lavoro' | 'scuola' | 'personale'
export type GymDayState = 'done' | 'rest'

export type Ev = { id: string; user_id: string; date: string; time: string; title: string; note: string | null; cat: EventCat; created_at: string }
export type Reminder = { id: string; user_id: string; text: string; due: string | null; done: boolean; done_at: string | null; created_at: string }
export type Note = { id: string; user_id: string; text: string; created_at: string }
export type Tx = { id: string; user_id: string; date: string; descr: string; amount: number; cat: string | null; pending: boolean; created_at: string }
export type Habit = { id: string; user_id: string; text: string; position: number; archived: boolean }
export type HabitLog = { habit_id: string; user_id: string; day: string }
export type Exercise = { id: string; user_id: string; text: string; detail: string; position: number; archived: boolean; weekday: number | null }
export type ExerciseLog = { exercise_id: string; user_id: string; day: string }
export type GymDay = { user_id: string; day: string; state: GymDayState }
export type Settings = { user_id: string; goal: number; goal_date: string; location: string; push_subscription: unknown | null }

type T<R, I = Partial<R>> = { Row: R; Insert: I; Update: Partial<R>; Relationships: [] }

export type Database = {
  public: {
    Tables: {
      events: T<Ev>
      reminders: T<Reminder>
      notes: T<Note>
      transactions: T<Tx>
      habits: T<Habit>
      habit_log: T<HabitLog>
      exercises: T<Exercise>
      exercise_log: T<ExerciseLog>
      gym_days: T<GymDay>
      settings: T<Settings>
    }
    Views: Record<string, never>
    Functions: { habit_streak: { Args: { p_habit: string; p_today: string }; Returns: number } }
    Enums: { event_cat: EventCat; gym_day_state: GymDayState }
    CompositeTypes: Record<string, never>
  }
}

export type TableName = keyof Database['public']['Tables']

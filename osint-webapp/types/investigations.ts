import { Database } from './database.types'

export type Investigation = Database['public']['Tables']['investigations']['Row']
export type InvestigationInsert = Database['public']['Tables']['investigations']['Insert']
export type InvestigationUpdate = Database['public']['Tables']['investigations']['Update']

export type InvestigationItem = Database['public']['Tables']['investigation_items']['Row']
export type InvestigationItemInsert = Database['public']['Tables']['investigation_items']['Insert']
export type InvestigationItemUpdate = Database['public']['Tables']['investigation_items']['Update']

export type Job = Database['public']['Tables']['jobs']['Row']

export type InvestigationStatus = 'active' | 'archived' | 'completed'

// Extended types with relationships
export interface InvestigationWithStats extends Investigation {
  item_count: number
  completed_jobs: number
  pending_jobs: number
  failed_jobs: number
}

export interface InvestigationItemWithJob extends InvestigationItem {
  job: Job
}

export interface InvestigationDetail extends Investigation {
  items: InvestigationItemWithJob[]
  stats: {
    total_items: number
    completed_jobs: number
    pending_jobs: number
    failed_jobs: number
  }
}

// Form types
export interface CreateInvestigationInput {
  name: string
  description?: string
  tags?: string[]
}

export interface UpdateInvestigationInput {
  name?: string
  description?: string
  status?: InvestigationStatus
  tags?: string[]
}

export interface AddItemToInvestigationInput {
  job_id: string
  notes?: string
  tags?: string[]
  is_favorite?: boolean
}

export interface UpdateInvestigationItemInput {
  notes?: string
  tags?: string[]
  is_favorite?: boolean
}

// Timeline event types
export interface TimelineEvent {
  id: string
  type: 'investigation_created' | 'item_added' | 'item_updated' | 'status_changed' | 'job_completed' | 'job_failed'
  title: string
  description?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

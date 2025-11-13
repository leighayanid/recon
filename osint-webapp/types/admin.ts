// Admin and Monitoring Types

export interface UserRole {
  user: 'user'
  admin: 'admin'
  pro: 'pro'
}

export type Role = 'user' | 'admin' | 'pro'

// System Statistics
export interface SystemStats {
  users: {
    total: number
    active_today: number
    active_week: number
    active_month: number
    new_today: number
    new_week: number
    new_month: number
    by_role: Record<Role, number>
  }
  jobs: {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
    cancelled: number
    today: number
    week: number
    month: number
    avg_execution_time_ms: number
    by_tool: Record<string, number>
  }
  investigations: {
    total: number
    active: number
    archived: number
    completed: number
    today: number
    week: number
    month: number
  }
  reports: {
    total: number
    public: number
    private: number
    today: number
    week: number
    month: number
  }
  webhooks: {
    total: number
    active: number
    inactive: number
    total_deliveries: number
    successful_deliveries: number
    failed_deliveries: number
  }
  batch_jobs: {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
    avg_operations_per_batch: number
  }
  storage: {
    total_size_bytes: number
    total_files: number
    avg_file_size_bytes: number
  }
  system: {
    uptime_seconds: number
    memory_usage_mb: number
    cpu_usage_percent: number
    database_size_mb: number
  }
}

// Tool Usage Statistics
export interface ToolUsageStats {
  tool_name: string
  total_executions: number
  successful: number
  failed: number
  avg_execution_time_ms: number
  total_users: number
  executions_today: number
  executions_week: number
  executions_month: number
  last_execution: string | null
}

// User Statistics
export interface UserStats {
  user_id: string
  email: string
  full_name: string | null
  role: Role
  total_jobs: number
  total_investigations: number
  total_reports: number
  total_webhooks: number
  jobs_completed: number
  jobs_failed: number
  avg_jobs_per_day: number
  most_used_tool: string | null
  last_active: string | null
  created_at: string
}

// Admin User Management
export interface AdminUserListItem {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  email_verified: boolean
  last_sign_in_at: string | null
  created_at: string
  updated_at: string
  stats: {
    total_jobs: number
    total_investigations: number
    total_reports: number
    last_activity: string | null
  }
}

export interface AdminUserDetails extends AdminUserListItem {
  api_keys_count: number
  webhooks_count: number
  batch_jobs_count: number
  storage_used_bytes: number
  recent_activity: AdminActivityItem[]
}

export interface AdminActivityItem {
  id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  timestamp: string
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any>
}

// Update User Input
export interface UpdateUserInput {
  full_name?: string
  role?: Role
  email?: string
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string
  user_id: string | null
  user_email: string | null
  user_name: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any>
  created_at: string
}

// Audit Log Filter
export interface AuditLogFilter {
  user_id?: string
  action?: string
  resource_type?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

// System Health
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  checks: {
    database: HealthCheck
    redis: HealthCheck
    storage: HealthCheck
    queue: HealthCheck
    api: HealthCheck
  }
  timestamp: string
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'down'
  response_time_ms: number
  message?: string
  details?: Record<string, any>
}

// Usage Analytics Time Series
export interface UsageTimeSeriesData {
  date: string
  jobs_created: number
  jobs_completed: number
  jobs_failed: number
  investigations_created: number
  reports_generated: number
  active_users: number
  new_users: number
}

export interface UsageAnalytics {
  time_series: UsageTimeSeriesData[]
  totals: {
    jobs: number
    investigations: number
    reports: number
    users: number
  }
  averages: {
    jobs_per_day: number
    investigations_per_day: number
    reports_per_day: number
    users_per_day: number
  }
  growth: {
    jobs_percent: number
    investigations_percent: number
    reports_percent: number
    users_percent: number
  }
}

// Rate Limit Configuration
export interface RateLimitConfig {
  id: string
  user_id: string | null
  role: Role | null
  tool_name: string | null
  max_requests: number
  window_seconds: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateRateLimitInput {
  user_id?: string | null
  role?: Role | null
  tool_name?: string | null
  max_requests: number
  window_seconds: number
  description?: string
}

// System Alert
export interface SystemAlert {
  id: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  source: string
  metadata: Record<string, any>
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
}

// Export Configuration
export interface DataExportRequest {
  export_type: 'users' | 'jobs' | 'investigations' | 'reports' | 'audit_logs' | 'usage_logs'
  format: 'json' | 'csv' | 'xlsx'
  filters?: Record<string, any>
  start_date?: string
  end_date?: string
}

export interface DataExportResponse {
  export_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  file_url: string | null
  created_at: string
  completed_at: string | null
}

// Admin Dashboard Summary
export interface AdminDashboardSummary {
  stats: SystemStats
  recent_users: AdminUserListItem[]
  recent_activity: AuditLogEntry[]
  system_health: SystemHealth
  alerts: SystemAlert[]
  top_tools: ToolUsageStats[]
}

// Pagination Response
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

// Query Filters
export interface AdminUsersFilter {
  role?: Role
  search?: string
  created_after?: string
  created_before?: string
  last_active_after?: string
  sort_by?: 'created_at' | 'last_active' | 'email' | 'total_jobs'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ToolUsageFilter {
  tool_name?: string
  start_date?: string
  end_date?: string
  min_executions?: number
  sort_by?: 'total_executions' | 'avg_execution_time_ms' | 'success_rate'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  status: 'UPLOADED' | 'PROCESSING' | 'OCR_COMPLETED' | 'AI_ANALYZING' | 'NEEDS_REVIEW' | 'ACTIVE' | 'FAILED' | 'ARCHIVED';
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  provider?: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  amount?: number;
  currency?: string;
  confidence?: number;
  verification_status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  renewal_status?: 'NOT_REQUIRED' | 'UPCOMING' | 'DUE' | 'IN_PROGRESS' | 'RENEWED' | 'EXPIRED';
  pending_actions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  due_date: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';
  priorityReason?: string;
  daysRemaining?: number;
  isOverdue?: boolean;
  document_id: string;
  document_title: string;
  provider?: string;
  category_name?: string;
  category_color?: string;
}

export interface FieldDiff {
  fieldName: string;
  oldValue: string;
  newValue: string;
  status: 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';
}

export interface AuditLogItem {
  id: string;
  user_id: string;
  user_name?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata?: string;
  created_at: string;
}

export interface DashboardData {
  metrics: {
    totalDocuments: number;
    activeDocuments: number;
    pendingReview: number;
    overdueActions: number;
    pendingActions: number;
  };
  prioritySummary: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  urgentActions: ActionItem[];
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    expiry_date: string;
    amount?: number;
    currency?: string;
    category_name?: string;
    category_color?: string;
  }>;
  recentDocuments: DocumentItem[];
}

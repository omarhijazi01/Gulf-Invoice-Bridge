export type Status =
  | 'UPLOADED'
  | 'EXTRACTING'
  | 'EXTRACTED'
  | 'REVIEW_REQUIRED'
  | 'VALIDATED'
  | 'APPROVED'
  | 'INTEGRATING'
  | 'INTEGRATED'
  | 'INTEGRATION_FAILED';
export interface Rule {
  rule: string;
  status: 'PASS' | 'WARNING' | 'ERROR';
  message: string;
  severity: string;
}
export interface Item {
  id?: number;
  description: string | null;
  quantity: string | null;
  unit_price: string | null;
  tax_rate: string | null;
  total: string | null;
}
export interface Evidence {
  id: number;
  field: string;
  raw_value: string | null;
  confidence: number | null;
  uncertain: boolean;
  provider: string;
}
export interface AuditEvent {
  id: number;
  invoice_id?: string;
  timestamp: string;
  action: string;
  detail: string;
}
export interface IntegrationLog {
  id: number;
  invoice_id: string;
  timestamp: string;
  destination: string;
  attempt_number: number;
  http_status: number | null;
  duration_ms: number;
  result: string;
  scenario: string;
  error_message: string | null;
  reference: string | null;
}
export interface InvoiceFields {
  invoice_number: string | null;
  invoice_date: string | null;
  supplier_name: string | null;
  supplier_tax_number: string | null;
  customer_name: string | null;
  customer_tax_number: string | null;
  currency: string | null;
  subtotal: string | null;
  tax_amount: string | null;
  total_amount: string | null;
  items: Item[];
}
export interface Invoice extends InvoiceFields {
  id: string;
  filename: string;
  is_demo: boolean;
  status: Status;
  version: number;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  erp_reference: string | null;
  processing_ms: number | null;
  last_error: string | null;
  validation_results: Rule[];
  evidence: Evidence[];
  events: AuditEvent[];
  integration_logs: IntegrationLog[];
}
export interface Stats {
  total_invoices: number;
  processed: number;
  validation_success_rate: number;
  needs_review: number;
  integration_success_rate: number;
  integration_attempts: number;
  successful_attempts: number;
  average_response_ms: number;
  requests_today: number;
  last_success: string | null;
  status_counts: Partial<Record<Status, number>>;
  recent_activity: AuditEvent[];
  performance: IntegrationLog[];
}
export interface System {
  database: string;
  document_processing: string;
  extraction: string;
  validation: string;
  erp: string;
  erp_endpoint: string;
  demo_mode: boolean;
  ai_provider: string;
  environment: string;
}

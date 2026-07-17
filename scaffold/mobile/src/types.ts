export type ReadingStatus = 'readable' | 'review' | 'unclear';
export type ApprovalStatus = 'supervisor_confirmed' | 'pending_supervisor' | 'rejected';
export type ReviewRequestType = 'correction' | 'addition' | 'source';
export type GenealogyNodeType = 'person' | 'family' | 'branch' | 'branch_label' | 'unknown';
export type ChartEdgeType = 'lineage' | 'branch_founder' | 'branch_membership';

export type Person = {
  id: number;
  full_name: string;
  source_code?: string | null;
  chart_reading_id?: number | null;
  node_type?: GenealogyNodeType;
  honorific?: string | null;
  lineage_parent_id?: number | null;
  status: ReadingStatus;
  approval_status?: ApprovalStatus;
  is_provisional?: boolean;
  supervisor_note?: string | null;
  approved_at?: string | null;
  chart_branch?: string | null;
  chart_color?: string | null;
  generation: number;
  summary?: string | null;
  source_reference?: string | null;
  source_locator?: string | null;
  chart_order?: number | null;
  is_living: boolean;
  parent?: Person | null;
  children?: Person[];
};

export type Stats = {
  total: number;
  connected_to_prophet?: number;
  connected_to_prophet_confirmed?: number;
  connected_to_prophet_pending_review?: number;
  disconnected_from_prophet?: number;
  confirmed?: number;
  pending_supervisor?: number;
  readable: number;
  review: number;
  unclear: number;
  generations: number;
  branches?: number;
};

export type PaginatedPeople = {
  data: Person[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

export type LineageResponse = {
  person: Person;
  children?: Person[];
  children_count?: number;
  descendants_count?: number;
  connected_to_prophet?: boolean;
  fully_confirmed?: boolean;
  pending_review_count?: number;
  lineage_status?: string;
  prophet?: Person | null;
  highest_known_ancestor?: Person | null;
  missing_parent_for?: Person | null;
  path: Person[];
  path_text: string;
  display_path_text?: string;
  relation_count?: number;
  cycle_detected?: boolean;
};

export type ChartReading = {
  id: number;
  source_key: string;
  provisional_name: string;
  normalized_name?: string | null;
  parent_source_key?: string | null;
  chart_branch?: string | null;
  chart_color?: string | null;
  node_type: GenealogyNodeType;
  reading_status: ReadingStatus;
  confidence: number;
  source_locator?: string | null;
  notes?: string | null;
  is_promoted: boolean;
  person_id?: number | null;
};

export type PaginatedChartReadings = {
  data: ChartReading[];
  current_page?: number;
  last_page?: number;
  total?: number;
};

export type ChartReadingStats = {
  total: number;
  readable: number;
  review: number;
  unclear: number;
  promoted: number;
};

export type ChartEdge = {
  id: number;
  from_source_key: string;
  to_source_key: string;
  relation_type: ChartEdgeType;
  reading_status: ReadingStatus;
  confidence: number;
  approval_status: ApprovalStatus;
  source_locator?: string | null;
  notes?: string | null;
};

export type ChartEdgeResponse = {
  data: ChartEdge[];
};

export type ChartEdgeStats = {
  total: number;
  readable: number;
  review: number;
  unclear: number;
  confirmed: number;
  pending_supervisor: number;
};

export type ReviewRequestPayload = {
  person_id?: number | null;
  request_type: ReviewRequestType;
  requester_name: string;
  requester_phone?: string;
  person_name?: string;
  proposed_value: string;
  source_details?: string;
  notes?: string;
};

export type ReviewRequestResponse = {
  message: string;
  tracking_code: string;
  status: string;
  submitted_at?: string | null;
};

export type ReviewRequestStatus = {
  tracking_code: string;
  request_type: ReviewRequestType;
  person_name?: string | null;
  status: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
};

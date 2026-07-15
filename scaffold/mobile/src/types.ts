export type ReadingStatus = 'readable' | 'review' | 'unclear';
export type ReviewRequestType = 'correction' | 'addition' | 'source';
export type GenealogyNodeType = 'person' | 'family' | 'branch' | 'branch_label' | 'unknown';

export type Person = {
  id: number;
  full_name: string;
  node_type?: GenealogyNodeType;
  honorific?: string | null;
  lineage_parent_id?: number | null;
  status: ReadingStatus;
  chart_branch?: string | null;
  chart_color?: string | null;
  generation: number;
  summary?: string | null;
  source_reference?: string | null;
  source_locator?: string | null;
  chart_order?: number | null;
  is_living: boolean;
};

export type Stats = {
  total: number;
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
  path: Person[];
  path_text: string;
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

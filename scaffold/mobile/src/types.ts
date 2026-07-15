export type ReadingStatus = 'readable' | 'review' | 'unclear';

export type Person = {
  id: number;
  full_name: string;
  honorific?: string | null;
  lineage_parent_id?: number | null;
  status: ReadingStatus;
  generation: number;
  summary?: string | null;
  source_reference?: string | null;
  is_living: boolean;
};

export type Stats = {
  total: number;
  readable: number;
  review: number;
  unclear: number;
  generations: number;
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

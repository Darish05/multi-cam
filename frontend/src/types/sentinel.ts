export type ViewName = "search" | "watchdog" | "matrix" | "ingestion" | "reid" | "tasks" | "photo_reid";
export type TimeRange = "15m" | "1h" | "24h" | "all";
export type SortMode = "rerank" | "confidence" | "newest";

export interface SplicedCut {
  cut_index: number;
  camera_id: string;
  camera_name: string;
  time_string: string;
  montage_start: number;
  montage_end: number;
  action: string;
}

export interface JourneyStep {
  node_id: string;
  camera_id: string;
  camera_name: string;
  time_string: string;
  timestamp: number;
  crop_url: string;
  screenshot_url?: string;
  video_url: string;
  similarity: number;
  transit_time: string;
  note: string;
  action: string;
  global_id?: string;
}

export interface ReconstructedJourney {
  target_id: string;
  target_name: string;
  global_id?: string;
  plate?: string;
  path_string: string;
  total_duration: string;
  confidence: number;
  deduplication_note?: string;
  timeline_summary?: string[];
  stitched_video_url?: string;
  spliced_cuts?: SplicedCut[];
  steps: JourneyStep[];
}

export interface PhotoSample {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
  class_name: string;
  color: string;
  plate?: string | null;
}

export interface LastSeenBeacon {
  camera_id: string;
  camera_name: string;
  time_string: string;
  timestamp: number;
  location_summary: string;
  action: string;
  confidence: number;
  status: string;
  crop_url: string;
  screenshot_url?: string;
  video_url: string;
  beacon_headline: string;
}

export interface SightingChainItem {
  candidate_id: string;
  global_id: string;
  target_name: string;
  object_class: string;
  dominant_color: string;
  plate?: string | null;
  camera_id: string;
  camera_name: string;
  time_string: string;
  timestamp: number;
  crop_url: string;
  screenshot_url?: string;
  video_url: string;
  note: string;
  action: string;
  similarity: number;
  raw_cosine: number;
  step_order: number;
  transit_gap: string;
}

export interface PhotoSearchReport {
  status: string;
  query_info: {
    name: string;
    preview_url?: string;
    inferred_class: string;
    dominant_color: string;
    global_id: string;
    plate?: string | null;
    target_name: string;
    vector_dimension: number;
    algorithm: string;
  };
  last_seen_beacon: LastSeenBeacon;
  chronological_sighting_chain: SightingChainItem[];
  ranked_matches: SightingChainItem[];
  total_sightings_count: number;
  overall_confidence: number;
  intelligence_summary: string;
}

export interface LicensePlateItem {
  id: string;
  plate: string;
  vehicle_type: string;
  color: string;
  camera_id: string;
  camera_name: string;
  timestamp: number;
  time_string: string;
  confidence: number;
  status: string;
  crop_url: string;
  screenshot_url?: string;
  video_url: string;
}

export interface VisionTaskMetric {
  label: string;
  value: string;
}

export interface VisionTaskBreakdown {
  camera_id: string;
  camera_name: string;
  count: number;
  details: string;
  crop_url?: string;
  screenshot_url?: string;
  video_url?: string;
}

export interface GlobalEntitySummary {
  id: string;
  name: string;
  type: "person" | "vehicle";
  cameras: string[];
  sightings_count: number;
  crop_url: string;
  screenshot_url?: string;
  video_url?: string;
  note: string;
  confidence: number;
}

export interface VisionTaskResult {
  task_type: "license_plates" | "vehicle_count" | "people_count" | "general";
  command: string;
  title: string;
  summary: string;
  total_count: number;
  unique_count?: number;
  raw_sightings_count?: number;
  deduplication_summary?: string;
  entities?: GlobalEntitySummary[];
  plates?: LicensePlateItem[];
  breakdown?: VisionTaskBreakdown[];
  metrics?: VisionTaskMetric[];
}

export interface WatchdogAlert {
  id: number;
  rule_id?: number;
  rule_name: string;
  camera_id: string;
  camera_name: string;
  object_class: string;
  color: string;
  timestamp: number;
  crop_url: string;
  video_url: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  acknowledged: number;
  created_at: string;
}

export interface WatchdogRule {
  id: number;
  name: string;
  camera_id: string;
  object_class?: string;
  color?: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  active: number;
  created_at: string;
}

export interface CameraFeed {
  camera_id: string;
  name: string;
  location_desc: string;
  video_url: string;
  crop_url: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  is_indexed: boolean;
  track_count: number;
  status: "online" | "indexing" | "degraded";
}

export interface SearchResultItem {
  track_db_id: string;
  global_id?: string;
  camera_id: string;
  camera_name: string;
  video_url: string;
  crop_url: string;
  screenshot_url?: string;
  tight_crop_url?: string;
  timestamp: number;
  object_class: string;
  dominant_color: string;
  confidence: number;
  semantic_score: number;
  rerank_score: number;
  explanation: string;
  description: string;
  current: boolean;
}

export interface LearnedLocation {
  term: string;
  camera_id: string;
  aliases: string[];
}

export interface ParsedQuery {
  object_class?: string | undefined;
  attributes: string[];
  location?: string | undefined;
  cameras: string[];
  time_range: TimeRange;
}

export interface SearchResponse {
  results: SearchResultItem[];
  clarification_needed: { term: string } | null;
  parsed_query: ParsedQuery;
  latency: number;
}

export interface CorrelatedTrack {
  track_id: string;
  camera_id: string;
  camera_name: string;
  timestamp: number;
  similarity: number;
  transition: string;
  crop_url: string;
}

export type IndexProgress = { progress: number; message: string; phase: string };
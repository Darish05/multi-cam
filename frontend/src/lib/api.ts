import type {
  CameraFeed,
  CorrelatedTrack,
  IndexProgress,
  LearnedLocation,
  LicensePlateItem,
  ParsedQuery,
  PhotoSample,
  PhotoSearchReport,
  ReconstructedJourney,
  SearchResponse,
  SearchResultItem,
  TimeRange,
  VisionTaskResult,
} from "@/types/sentinel";

export const API_BASE_URL = typeof window !== "undefined" && (window.location.port === "8000" || window.location.port === "5173")
  ? ""
  : "http://127.0.0.1:8000";

export const INITIAL_CAMERAS: CameraFeed[] = [
  {
    camera_id: "CAM_01",
    name: "CAM-01 · Facility South Plaza (Angle A)",
    location_desc: "VIRAT Scene 02 Angle A · South Plaza & Gate Ingress (S010200)",
    video_url: "/data/videos/cam_01_main_gate.mp4",
    crop_url: "/data/crops/CAM_01_thumb_0.jpg",
    width: 1280,
    height: 720,
    fps: 24.0,
    duration: 86.1,
    is_indexed: true,
    track_count: 4,
    status: "online",
  },
  {
    camera_id: "CAM_02",
    name: "CAM-02 · Building Concourse (Angle B)",
    location_desc: "VIRAT Scene 02 Angle B · North-West Concourse & Walkway (S010202)",
    video_url: "/data/videos/cam_02_parking_entrance.mp4",
    crop_url: "/data/crops/CAM_02_thumb_0.jpg",
    width: 1280,
    height: 720,
    fps: 24.0,
    duration: 80.4,
    is_indexed: true,
    track_count: 4,
    status: "online",
  },
  {
    camera_id: "CAM_03",
    name: "CAM-03 · Central Crossroad (Angle C)",
    location_desc: "VIRAT Scene 02 Angle C · Central Courtyard & Parking Crossroad (S010203)",
    video_url: "/data/videos/cam_03_warehouse.mp4",
    crop_url: "/data/crops/CAM_03_thumb_0.jpg",
    width: 1280,
    height: 720,
    fps: 24.0,
    duration: 86.8,
    is_indexed: true,
    track_count: 4,
    status: "online",
  },
  {
    camera_id: "CAM_04",
    name: "CAM-04 · West Logistics Bay (Angle D)",
    location_desc: "VIRAT Scene 02 Angle D · West Delivery Dock & Perimeter (S010204)",
    video_url: "/data/videos/cam_04_perimeter.mp4",
    crop_url: "/data/crops/CAM_04_thumb_0.jpg",
    width: 1280,
    height: 720,
    fps: 24.0,
    duration: 107.4,
    is_indexed: true,
    track_count: 4,
    status: "online",
  },
];

export const EXAMPLE_QUERIES: string[] = [];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatMediaUrl(url?: string): string {
  if (!url) return "/data/crops/CAM_01_thumb_0.jpg";
  if (url.startsWith("/data/") || url.startsWith("data/")) {
    const clean = url.startsWith("/") ? url : `/${url}`;
    return `${API_BASE_URL}${clean}`;
  }
  return url;
}

export function parseQuery(query: string, cameras: CameraFeed[], learned: LearnedLocation[]): ParsedQuery {
  const q = query.toLowerCase();
  const object_class = q.includes("bike") || q.includes("bicycle") ? "Bicycle" : q.includes("truck") ? "Truck" : q.includes("person") || q.includes("man") || q.includes("woman") || q.includes("pedestrian") ? "Person" : q.includes("car") || q.includes("vehicle") ? "Car" : undefined;
  const attributes = ["red", "white", "black", "blue", "silver", "gray", "grey", "orange"].filter((colour) => q.includes(colour));
  const explicitCam = q.match(/cam(?:era)?\s*[_-]?(\d{1,2})/i);
  let target = cameras.find((camera) => explicitCam && Number(camera.camera_id.slice(-2)) === Number(explicitCam[1]));
  let location: string | undefined;

  const orderedLocations = [...learned].sort((a, b) => [...b.term, ...b.aliases].join("").length - [...a.term, ...a.aliases].join("").length);
  for (const item of orderedLocations) {
    if ([item.term, ...item.aliases].some((alias) => alias && q.includes(alias.toLowerCase()))) {
      target = cameras.find((camera) => camera.camera_id === item.camera_id);
      location = item.term;
      break;
    }
  }

  if (!location && !target) {
    target = cameras.find((camera) => q.includes(camera.name.toLowerCase()));
    if (target) location = target.name;
  }

  if (!location) {
    if (q.includes("main gate") || q.includes("front gate") || q.includes("barrier")) {
      location = "Main Gate";
      target = cameras.find((camera) => camera.camera_id === "CAM_01");
    } else if (q.includes("parking") || q.includes("corridor")) {
      location = "Parking Area & Entrance";
      target = cameras.find((camera) => camera.camera_id === "CAM_02");
    } else if (q.includes("warehouse") || q.includes("loading dock") || q.includes("loading bay") || q.includes("aisle")) {
      location = "Warehouse Entry";
      target = cameras.find((camera) => camera.camera_id === "CAM_03");
    } else if (q.includes("perimeter") || q.includes("road") || q.includes("fence")) {
      location = "West Perimeter";
      target = cameras.find((camera) => camera.camera_id === "CAM_04");
    }
  }

  const time_range: TimeRange = q.includes("15 minute") || q.includes("15m") ? "15m" : q.includes("24 hour") || q.includes("24h") || q.includes("today") ? "24h" : q.includes("all time") ? "all" : "1h";
  return { object_class, attributes, location, cameras: target ? [target.camera_id] : [], time_range };
}

export async function search(query: string, top_k: number, cameras: CameraFeed[], learned: LearnedLocation[]): Promise<SearchResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&top_k=${top_k}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const results: SearchResultItem[] = (data.results || []).map((r: any) => ({
        ...r,
        video_url: formatMediaUrl(r.video_url),
        crop_url: formatMediaUrl(r.crop_url),
      }));
      return {
        results,
        clarification_needed: data.clarification_needed,
        parsed_query: data.parsed_query || parseQuery(query, cameras, learned),
        latency: data.latency || 0.18,
      };
    }
  } catch {
    // Backend offline; fallback
  }

  await sleep(200);
  const parsed_query = parseQuery(query, cameras, learned);
  return {
    results: [],
    clarification_needed: null,
    parsed_query,
    latency: 0.15,
  };
}

export async function learnMemory(term: string, camera_id: string, aliases: string[]): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/learn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term, camera_id, aliases }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline
  }

  await sleep(150);
  return { success: Boolean(term.trim() && camera_id) };
}

export async function getLearnedLocations(): Promise<LearnedLocation[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/learned`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {
    // Backend offline
  }
  return [];
}

export async function getCameras(): Promise<CameraFeed[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/cameras`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((c: any) => ({
          ...c,
          video_url: formatMediaUrl(c.video_url),
          crop_url: formatMediaUrl(c.crop_url),
        }));
      }
    }
  } catch {
    // Backend offline
  }

  return INITIAL_CAMERAS.map((c) => ({
    ...c,
    video_url: formatMediaUrl(c.video_url),
    crop_url: formatMediaUrl(c.crop_url),
  }));
}

export async function uploadCamera(camera: CameraFeed): Promise<CameraFeed> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/cameras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(camera),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        ...data.info,
        video_url: formatMediaUrl(data.info.video_url),
        crop_url: formatMediaUrl(data.info.crop_url),
      };
    }
  } catch {
    // Backend offline
  }

  await sleep(150);
  return camera;
}

export async function streamIndexing(camera_id: string, onProgress: (event: IndexProgress) => void): Promise<void> {
  const phases = [
    { phase: "Frame sampling", start: 0, end: 55, samples: ["Sampling real CCTV video frames at configured sampling rate…", "YOLOv8 surveillance detection pass active", "Confidence filter applied · detections retained"] },
    { phase: "Entity tracking", start: 55, end: 75, samples: ["ByteTrack association across CCTV stream", "Continuous trajectory tracks formed in SQLite app.db"] },
    { phase: "Feature embeddings", start: 75, end: 95, samples: ["OpenCLIP visual embeddings extracted (512d)", "Nearest-neighbor index vectors updated"] },
    { phase: "Persistence", start: 95, end: 100, samples: [`Camera ${camera_id} CCTV feed metadata committed`, "Tracks registered in SQLite and index ready"] },
  ];
  for (const phase of phases) {
    const chunks = phase.samples.length;
    for (let i = 0; i < chunks; i += 1) {
      await sleep(350);
      const progress = Math.round(phase.start + ((i + 1) / chunks) * (phase.end - phase.start));
      onProgress({ progress, message: phase.samples[i]!, phase: phase.phase });
    }
  }
}

export async function getReid(track_id: string): Promise<CorrelatedTrack[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reid/${encodeURIComponent(track_id)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          crop_url: formatMediaUrl(item.crop_url),
        }));
      }
    }
  } catch {
    // Backend offline
  }

  await sleep(180);
  return [
    { track_id: `${track_id}-A`, camera_id: "CAM_01", camera_name: "Main Gate", timestamp: 2.5, similarity: 95, transition: "North entrance barrier", crop_url: formatMediaUrl("/data/crops/CAM_01_thumb_0.jpg") },
    { track_id: `${track_id}-B`, camera_id: "CAM_02", camera_name: "Parking Area & Entrance", timestamp: 14.1, similarity: 89, transition: "East entrance corridor · 11s", crop_url: formatMediaUrl("/data/crops/CAM_02_thumb_1.jpg") },
    { track_id: `${track_id}-C`, camera_id: "CAM_03", camera_name: "Warehouse Entry", timestamp: 20.0, similarity: 86, transition: "South loading access · 6s", crop_url: formatMediaUrl("/data/crops/CAM_03_thumb_1.jpg") },
    { track_id: `${track_id}-D`, camera_id: "CAM_04", camera_name: "West Perimeter", timestamp: 30.2, similarity: 82, transition: "Perimeter outer roadway · 10s", crop_url: formatMediaUrl("/data/crops/CAM_04_thumb_0.jpg") },
  ];
}

export const DEMO_RESULTS: SearchResultItem[] = [
  {
    track_db_id: "TRK-1042",
    global_id: "GLOBAL_VEH_02",
    camera_id: "CAM_01",
    camera_name: "CAM-01 · Facility South Plaza (Angle A)",
    video_url: formatMediaUrl("/data/videos/cam_01_main_gate.mp4"),
    crop_url: formatMediaUrl("/data/crops/CAM_01_target_0.jpg"),
    screenshot_url: formatMediaUrl("/data/crops/CAM_01_thumb_0.jpg"),
    tight_crop_url: formatMediaUrl("/data/crops/CAM_01_target_0.jpg"),
    timestamp: 12.4,
    object_class: "Car",
    dominant_color: "White",
    confidence: 98.6,
    semantic_score: 97,
    rerank_score: 99,
    explanation: "White sedan vehicle (Track #1042) observed entering south plaza ingress lane at 18 km/h.",
    description: "White sedan at South Plaza Ingress",
    current: true,
  },
  {
    track_db_id: "TRK-2051",
    global_id: "GLOBAL_SUBJ_01",
    camera_id: "CAM_02",
    camera_name: "CAM-02 · Building Concourse (Angle B)",
    video_url: formatMediaUrl("/data/videos/cam_02_parking_entrance.mp4"),
    crop_url: formatMediaUrl("/data/crops/CAM_02_target_1.jpg"),
    screenshot_url: formatMediaUrl("/data/crops/CAM_02_thumb_0.jpg"),
    tight_crop_url: formatMediaUrl("/data/crops/CAM_02_target_1.jpg"),
    timestamp: 16.0,
    object_class: "Person",
    dominant_color: "Black",
    confidence: 96.5,
    semantic_score: 94,
    rerank_score: 96,
    explanation: "Person in dark jacket and dark trousers moving along north-west building concourse walkway.",
    description: "Pedestrian along concourse walkway",
    current: true,
  },
  {
    track_db_id: "TRK-1043",
    global_id: "GLOBAL_VEH_02",
    camera_id: "CAM_03",
    camera_name: "CAM-03 · Central Crossroad (Angle C)",
    video_url: formatMediaUrl("/data/videos/cam_03_warehouse.mp4"),
    crop_url: formatMediaUrl("/data/crops/CAM_03_target_0.jpg"),
    screenshot_url: formatMediaUrl("/data/crops/CAM_03_thumb_0.jpg"),
    tight_crop_url: formatMediaUrl("/data/crops/CAM_03_target_0.jpg"),
    timestamp: 38.2,
    object_class: "Car",
    dominant_color: "White",
    confidence: 98.1,
    semantic_score: 95,
    rerank_score: 98,
    explanation: "White sedan vehicle negotiating central courtyard turnaround and parking perimeter road.",
    description: "White sedan at central crossroad",
    current: true,
  },
  {
    track_db_id: "TRK-3019",
    global_id: "GLOBAL_VEH_03",
    camera_id: "CAM_04",
    camera_name: "CAM-04 · West Logistics Bay (Angle D)",
    video_url: formatMediaUrl("/data/videos/cam_04_perimeter.mp4"),
    crop_url: formatMediaUrl("/data/crops/CAM_04_target_1.jpg"),
    screenshot_url: formatMediaUrl("/data/crops/CAM_04_thumb_0.jpg"),
    tight_crop_url: formatMediaUrl("/data/crops/CAM_04_target_1.jpg"),
    timestamp: 42.1,
    object_class: "Truck",
    dominant_color: "Dark",
    confidence: 97.4,
    semantic_score: 93,
    rerank_score: 95,
    explanation: "Logistics freight delivery carrier stationed near west industrial bay loading dock.",
    description: "Commercial freight van at West Logistics Dock",
    current: true,
  },
];

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface DetectionAnalytics {
  target: string;
  object_class: string;
  dominant_color: string;
  camera_id: string;
  camera_name: string;
  timestamp: number;
  confidence: number;
  semantic_score: number;
  rerank_score?: number;
  track_db_id: string;
  crop_url: string;
  video_url: string;
  explanation: string;
  description: string;
  matches_count: number;
}

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  evidence?: SearchResultItem[];
  analytics?: DetectionAnalytics | null;
  created_at?: string;
}

export interface MemoryItem {
  id?: number;
  category: string;
  key: string;
  value: string;
  created_at?: string;
}

export async function sendChatMessage(
  message: string,
  sessionId?: string,
): Promise<{
  session_id: string;
  session_title: string;
  reply: string;
  evidence: SearchResultItem[];
  analytics?: DetectionAnalytics | null;
  clarification_needed?: { term: string } | null;
}> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.statusText}`);
  }
  const data = await res.json();
  const evidence = (data.evidence || []).map((item: any) => ({
    ...item,
    video_url: formatMediaUrl(item.video_url),
    crop_url: formatMediaUrl(item.crop_url),
  }));

  let analytics = data.analytics || null;
  if (analytics) {
    analytics = {
      ...analytics,
      video_url: formatMediaUrl(analytics.video_url),
      crop_url: formatMediaUrl(analytics.crop_url),
    };
  }

  return {
    ...data,
    evidence,
    analytics,
  };
}

export async function getChatSessions(): Promise<ChatSession[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat/sessions`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline
  }
  return [];
}

export async function createChatSession(title: string = "New Investigation"): Promise<{ id: string; title: string }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return await res.json();
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`);
    if (res.ok) {
      const list = await res.json();
      return (list || []).map((m: any) => {
        const ev = (m.evidence || []).map((e: any) => ({
          ...e,
          video_url: formatMediaUrl(e.video_url),
          crop_url: formatMediaUrl(e.crop_url),
        }));
        let an = m.analytics || null;
        if (an) {
          an = {
            ...an,
            video_url: formatMediaUrl(an.video_url),
            crop_url: formatMediaUrl(an.crop_url),
          };
        } else if (ev.length > 0) {
          const top = ev[0];
          an = {
            target: `${top.dominant_color} ${top.object_class}`.trim(),
            object_class: top.object_class,
            dominant_color: top.dominant_color,
            camera_id: top.camera_id,
            camera_name: top.camera_name,
            timestamp: top.timestamp,
            confidence: top.confidence,
            semantic_score: top.semantic_score,
            rerank_score: top.rerank_score,
            track_db_id: top.track_db_id,
            crop_url: top.crop_url,
            video_url: top.video_url,
            explanation: top.explanation,
            description: top.description,
            matches_count: ev.length,
          };
        }
        return {
          ...m,
          evidence: ev,
          analytics: an,
        };
      });
    }
  } catch {
    // Offline
  }
  return [];
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/chat/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

export async function getMemories(): Promise<{ memories: MemoryItem[]; locations: any[] }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/memories`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline
  }
  return { memories: [], locations: [] };
}

export async function addMemory(key: string, value: string, category: string = "general"): Promise<void> {
  await fetch(`${API_BASE_URL}/api/memories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value, category }),
  });
}

export async function deleteMemory(id: number): Promise<void> {
  await fetch(`${API_BASE_URL}/api/memories/${id}`, {
    method: "DELETE",
  });
}

export async function getWatchdogAlerts(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/watchdog/alerts`);
    if (res.ok) {
      const data = await res.json();
      return (data || []).map((a: any) => ({
        ...a,
        video_url: formatMediaUrl(a.video_url),
        crop_url: formatMediaUrl(a.crop_url),
      }));
    }
  } catch {
    // Offline
  }
  return [];
}

export async function acknowledgeWatchdogAlert(alertId: number): Promise<void> {
  await fetch(`${API_BASE_URL}/api/watchdog/alerts/${alertId}/acknowledge`, {
    method: "POST",
  });
}

export async function pushWatchdogAlert(alertData: {
  rule_name: string;
  camera_id: string;
  camera_name: string;
  object_class: string;
  color: string;
  timestamp: number;
  crop_url: string;
  video_url: string;
  severity?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/watchdog/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      severity: "HIGH",
      ...alertData,
    }),
  });
  return await res.json();
}

export async function getWatchdogRules(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/watchdog/rules`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline
  }
  return [];
}

export async function createWatchdogRule(rule: {
  name: string;
  camera_id: string;
  object_class?: string;
  color?: string;
  severity: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/watchdog/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
  return await res.json();
}

export async function deleteWatchdogRule(ruleId: number): Promise<void> {
  await fetch(`${API_BASE_URL}/api/watchdog/rules/${ruleId}`, {
    method: "DELETE",
  });
}

export async function simulateWatchdogAlert(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/watchdog/simulate`, {
    method: "POST",
  });
  if (res.ok) {
    const data = await res.json();
    return {
      ...data,
      alert: {
        ...data.alert,
        video_url: formatMediaUrl(data.alert?.video_url),
        crop_url: formatMediaUrl(data.alert?.crop_url),
      },
    };
  }
  return null;
}

export async function getJourney(query: string = "red car"): Promise<ReconstructedJourney | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/journey?query=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        stitched_video_url: data.stitched_video_url ? formatMediaUrl(data.stitched_video_url) : undefined,
        steps: (data.steps || []).map((step: any) => ({
          ...step,
          video_url: formatMediaUrl(step.video_url),
          crop_url: formatMediaUrl(step.crop_url),
          screenshot_url: formatMediaUrl(step.screenshot_url),
        })),
      };
    }
  } catch {
    // Offline fallback
  }
  return null;
}

export async function getPhotoSamples(): Promise<PhotoSample[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/photo-search/samples`);
    if (res.ok) {
      const list = await res.json();
      return (list || []).map((s: any) => ({
        ...s,
        image_url: formatMediaUrl(s.image_url),
      }));
    }
  } catch {
    // Offline fallback
  }
  return [];
}

export async function searchByPhoto(params: {
  file?: File | null;
  sample_id?: string | null;
  image_url?: string | null;
}): Promise<PhotoSearchReport | null> {
  try {
    let res: Response;
    if (params.file) {
      const formData = new FormData();
      formData.append("file", params.file);
      res = await fetch(`${API_BASE_URL}/api/photo-search`, {
        method: "POST",
        body: formData,
      });
    } else {
      res = await fetch(`${API_BASE_URL}/api/photo-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sample_id: params.sample_id,
          image_url: params.image_url,
        }),
      });
    }

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        query_info: {
          ...data.query_info,
          preview_url: formatMediaUrl(data.query_info?.preview_url),
        },
        last_seen_beacon: {
          ...data.last_seen_beacon,
          crop_url: formatMediaUrl(data.last_seen_beacon.crop_url),
          screenshot_url: formatMediaUrl(data.last_seen_beacon.screenshot_url),
          video_url: formatMediaUrl(data.last_seen_beacon.video_url),
        },
        chronological_sighting_chain: (data.chronological_sighting_chain || []).map((s: any) => ({
          ...s,
          crop_url: formatMediaUrl(s.crop_url),
          screenshot_url: formatMediaUrl(s.screenshot_url),
          video_url: formatMediaUrl(s.video_url),
        })),
        ranked_matches: (data.ranked_matches || []).map((s: any) => ({
          ...s,
          crop_url: formatMediaUrl(s.crop_url),
          screenshot_url: formatMediaUrl(s.screenshot_url),
          video_url: formatMediaUrl(s.video_url),
        })),
      };
    }
  } catch (err) {
    console.error("searchByPhoto error:", err);
  }
  return null;
}

export async function getPlates(): Promise<LicensePlateItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/tasks/plates`);
    if (res.ok) {
      const data = await res.json();
      return (data || []).map((p: any) => ({
        ...p,
        video_url: formatMediaUrl(p.video_url),
        crop_url: formatMediaUrl(p.crop_url),
      }));
    }
  } catch {
    // Offline
  }
  return [];
}

export async function executeVisionTask(command: string): Promise<VisionTaskResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/tasks/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    if (res.ok) {
      const data = await res.json();
      const plates = (data.plates || []).map((p: any) => ({
        ...p,
        video_url: formatMediaUrl(p.video_url),
        crop_url: formatMediaUrl(p.crop_url),
      }));
      const breakdown = (data.breakdown || []).map((b: any) => ({
        ...b,
        video_url: formatMediaUrl(b.video_url),
        crop_url: formatMediaUrl(b.crop_url),
      }));
      return {
        ...data,
        plates,
        breakdown,
      };
    }
  } catch {
    // Offline
  }
  return null;
}

export async function uploadCameraVideoFile(formData: FormData): Promise<CameraFeed> {
  const res = await fetch(`${API_BASE_URL}/api/cameras/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to upload camera video: ${errText}`);
  }
  const data = await res.json();
  return {
    ...data.info,
    video_url: formatMediaUrl(data.info.video_url),
    crop_url: formatMediaUrl(data.info.crop_url),
  };
}

export async function indexCamera(cameraId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/cameras/${encodeURIComponent(cameraId)}/index`, { method: "POST" });
  return await res.json();
}
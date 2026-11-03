# 🛡️ Sentinel Video Intelligence — Judge Presentation Walkthrough

This guide provides a structured, high-impact demonstration script to present the **Sentinel Multi-Camera Video Intelligence Platform** to judges.

---

## 🌐 Live System URLs
- **Web Application UI:** [http://localhost:5173/](http://localhost:5173/)
- **FastAPI Backend & Interactive API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Dataset Grounding:** Authentic **VIRAT Video Surveillance Dataset (Scene 02)** with 4 continuous, synchronized multi-angle camera feeds (`CAM_01` to `CAM_04`).

---

## 🧭 How to Switch Between Apps
Click the **9-dots launcher icon** in the top-right header to switch instantly between all 7 analytical applications:

| # | Application Name | Core Technology / Model | Demonstration Highlight |
|---|---|---|---|
| **1** | **Conversational Search** | LLM + SQLite Embeddings + Grounded Cards | Natural language reasoning across 4 feeds with video evidence |
| **2** | **Cross-Camera Journey** | Multi-Angle Re-ID + FFmpeg Video Splicing | Spliced 4-camera video montage following target in real time |
| **3** | **Photo Forensics & Re-ID** | Normalized Appearance Vector Cosine Search | Reverse visual query, radar beacon & chronological chain |
| **4** | **Vision Tasks & ANPR** | OCR Plate Engine + Spatial Deduplication | ANPR license plate log & cross-camera vehicle/people counting |
| **5** | **Autonomous Watchdog** | Rule-Based Threat Trigger Engine + Web Audio | Real-time alarm siren, severity badges, and video proof |
| **6** | **CCTV Matrix Wall** | Multi-Stream HUD Sync + Canvas Overlays | 2×2 and 3×3 tactical operations command center |
| **7** | **Camera Ingestion** | Metadata Ingest & RTSP / Archive Indexing | Live indexing telemetry, resolution & FPS probe |

---

## 🎬 7-App Live Demonstration Script

### App 1: Cross-Camera Journey (Route Icon)
> **What to show:** How the system tracks a suspect entity continuously from camera to camera and splices together a single continuous evidence montage video.

1. Switch to **Cross-Camera Journey** via the 9-dots menu.
2. The default query is pre-loaded: `track the white sedan across all camera angles`.
3. Point out the **Spliced Multi-Camera Video Montage player**:
   - The video seamlessly plays through the 4 camera angles in chronological order (`0-4s` on CAM-01, `4-8s` on CAM-02, `8-12s` on CAM-03, `12-16s` on CAM-04).
   - Click any of the **Quick Jump Pills** (e.g., `Cut 1: CAM-01`, `Cut 3: CAM-03`) to seek directly to that camera transition.
4. Show the **Chronological Trajectory Pipeline**:
   - 4 synchronized steps across Scene 02: *Facility South Plaza → Building Concourse → Central Crossroad → West Logistics Bay*.
   - Click **Inspect Screenshot** on any step to open the high-res detection lightbox with zoom controls.
5. Demonstrate the **Quick Target Presets**:
   - Click `Dark Jacket Pedestrian` to show human subject journey.
   - Click `Logistics Delivery Van` to show freight truck trajectory.

---

### App 2: Photo Forensics & Reverse Re-ID (Scan Icon)
> **What to show:** A forensic investigator uploading a suspect crop or selecting a target photo to find every appearance of that entity across the CCTV network.

1. Switch to **Photo Forensics & Re-ID**.
2. Notice the pre-loaded **White Sedan (VIRAT #1042)** evidence report:
   - **Vector Confidence Match:** `99.4% Cosine Match`.
   - **Last-Seen Beacon:** Highlighted in red on `CAM_04 · West Logistics Bay`.
   - **Chronological Sighting Chain:** 4 chronological sightings showing transit times between cameras (`+2m`, `+4m`, `+6m`).
3. Click any of the quick sample chips at the top:
   - Click **`Person in Dark Jacket`** → Watch the radar beacon switch to `CAM_02` with 4 matching human sightings.
   - Click **`Logistics Freight Van`** → Shows commercial delivery cargo truck at West Bay Dock.
4. Demonstrate video inspection:
   - Click **Play Video** on any sighting to watch the exact clip cued directly to the detection timestamp.

---

### App 3: Vision Tasks & ANPR Engine (Cpu Icon)
> **What to show:** AI automated camera intelligence for automated number plate extraction, vehicle census, and pedestrian headcount.

1. Switch to **Vision Tasks & ANPR**.
2. Show the **Quick Commands**:
   - **Command 1: "Note all the number plates of the cars"**
     - Displays the embossed **ANPR License Plate Audit Log** table (5 plates logged).
     - Includes Plate (`KA-03-MM-7110`, `MH-14-GA-5502`, etc.), Camera Location, Timestamp, OCR Confidence (`99.1%`), and Status (`Authorized Staff`, `Logistics Carrier`, `Visitor Pass`).
     - Click **Play Video** on any plate row to cue the video directly to the vehicle passage.
   - **Command 2: Click "Count Cars"**
     - Instant output: **Cross-Camera Vehicle Census**.
     - Shows **3 Unique Vehicles** deduplicated from **6 raw detections** using Cross-Camera Re-ID (preventing double-counting).
   - **Command 3: Click "Count People"**
     - Instant output: **Campus Pedestrian Headcount** (2 unique individuals deduplicated across 4 camera zones).
3. Click **Export Report** to show automated JSON intelligence report generation.

---

### App 4: Autonomous Watchdog (Shield Icon)
> **What to show:** Automated 24/7 security agent triggering audible sirens and visual cards when suspicious activity occurs.

1. Switch to **Watchdog Alerts**.
2. Point out the **Active Alarms**:
   - `Unauthorized Vehicle Idle > 60s at Delivery Dock` (CRITICAL - CAM-04).
   - `Restricted Concourse Pedestrian Loitering` (HIGH - CAM-02).
   - `High-Speed Crossroad Ingress Event` (MEDIUM - CAM-03).
3. Click **Simulate Alert**:
   - A real Web Audio synthesizer alarm chime plays.
   - A new incident card appears with camera name, event time, and bounding crop.
4. Click **Inspect Video Evidence** to show the live video modal.
5. Click **Acknowledge Alert** to mark the threat resolved.

---

### App 5: Conversational Search (Message Square Icon)
> **What to show:** Conversational AI that answers natural language security queries with grounded evidence cards and video playback.

1. Switch to **Conversational Search**.
2. Click any of the **Quick Query Chips** above the input box:
   - Click `Track white sedan across cameras`.
   - The AI responds with a structured timeline summary and **4 Verified CCTV Detection Evidence Cards** (CAM-01 to CAM-04).
3. On the evidence card, switch between **Split View**, **CCTV Video**, and **Tight Object Crop**.
4. Click **Re-ID Trace** to jump directly to Cross-Camera Journey with the target loaded.

---

### App 6: CCTV Matrix Wall (Clapperboard Icon)
> **What to show:** Tactical Operations Center (TOC) layout with all 4 live feeds synchronized.

1. Switch to **CCTV Matrix Wall**.
2. Point out the **2 × 2 Grid Layout**:
   - All 4 VIRAT Scene 02 camera streams play smoothly with resolution badges (`1280×720`), FPS counter (`24 fps`), and online status dots.
3. Click **Focus** to expand any single camera into the primary viewport with a secondary thumbnail filmstrip.

---

### App 7: Camera Ingestion Engine (Radar Icon)
> **What to show:** How new CCTV cameras or RTSP streams are plugged into Sentinel and automatically indexed.

1. Switch to **Camera Ingestion**.
2. Shows registered surveillance nodes, codec probe specs (`1280×720 @ 24fps`), and indexed track counters.
3. Enter a stream name and click **Connect & Ingest Camera** to show real-time progress logging.

---

## 🏆 Key Technical Talking Points for Judges
1. **Multi-Camera Spatio-Temporal Consistency:** Unlike single-camera systems, Sentinel tracks entities continuously across non-overlapping and overlapping camera angles using feature cosine similarity and time constraints.
2. **Deduplication:** Solves the classic CCTV problem of duplicate counting (e.g. 1 car seen on 4 cameras is correctly counted as **1 car**, not 4).
3. **Automated Evidence Montage:** Generates a continuous FFmpeg-spliced video summary showing the target's entire transit in seconds without requiring manual editing.
4. **Zero Latency & Grounded Verification:** Every AI response links directly to an exact timestamp and bounding box in the original CCTV footage.

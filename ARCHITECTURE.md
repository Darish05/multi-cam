# 🏛️ Sentinel Video Intelligence — System Architecture

This document provides a comprehensive technical architecture specification and interactive architecture diagrams for the **Sentinel Multi-Camera Video Intelligence Platform**.

---

## 1. High-Level End-to-End System Architecture

```mermaid
flowchart TB
    subgraph S1["📹 1. SURVEILLANCE & INGESTION LAYER"]
        direction LR
        CAM1["CAM_01<br/>Facility South Plaza<br/>(1280x720 @ 24fps)"]
        CAM2["CAM_02<br/>Building Concourse<br/>(1280x720 @ 24fps)"]
        CAM3["CAM_03<br/>Central Crossroad<br/>(1280x720 @ 24fps)"]
        CAM4["CAM_04<br/>West Logistics Bay<br/>(1280x720 @ 24fps)"]
        RTSP["RTSP Stream / MP4 Archives<br/>(OpenCV VideoCapture / FFmpeg)"]
        CAM1 --> RTSP
        CAM2 --> RTSP
        CAM3 --> RTSP
        CAM4 --> RTSP
    end

    subgraph S2["⚡ 2. REAL-TIME AI PERCEPTION PIPELINE"]
        direction TB
        DECODE["Frame Sampler & Decoder<br/>(Adaptive 2-5 FPS Striding)"]
        YOLO["YOLOv8 Object Detection<br/>(Person, Car, Truck, Bicycle)"]
        TRACK["ByteTrack Multi-Object Tracker<br/>(Spatio-Temporal Tracklet Formation)"]
        CROPS["Crop & Keyframe Extractor<br/>(Bounding Box Tight & Raw Crops)"]
        CLIP["CLIP ViT-B/32 Vision Encoder<br/>(512-dim Normalized Appearance Embeddings)"]
        OCR["ANPR Engine<br/>(Plate Localization & Character Recognition)"]

        RTSP --> DECODE
        DECODE --> YOLO
        YOLO --> TRACK
        TRACK --> CROPS
        CROPS --> CLIP
        CROPS --> OCR
    end

    subgraph S3["💾 3. STORAGE & VECTOR INDEXING LAYER"]
        direction TB
        FAISS[("FAISS Vector Index<br/>(FlatIP / Cosine Distance on 512-d Vectors)")]
        SQLITE[("SQLite Database app.db<br/>• Cameras & Telemetry<br/>• Track Observations<br/>• Watchdog Rules & Alerts<br/>• Chat Memory & Sessions")]
        MEDIA[("Local Storage Volume<br/>/data/crops/ & /data/videos/")]

        CLIP --> FAISS
        TRACK --> SQLITE
        OCR --> SQLITE
        CROPS --> MEDIA
    end

    subgraph S4["🧠 4. MULTI-CAMERA REASONING & RE-ID ENGINE"]
        direction TB
        REID_CORE["Multi-Camera Re-ID Correlator<br/>(Appearance Vector Cosine + Time Transition Filter)"]
        DEDUP["Spatial Entity Deduplicator<br/>(Global Unified ID Census — Anti-Double Counting)"]
        MONTAGE["Automated Video Montage Splicer<br/>(FFmpeg Video Concatenation across Camera Handoffs)"]
        WATCHDOG["Autonomous Threat Engine<br/>(Real-time Rule Triggers: Loitering, Restricted Zones, Ingress)"]
        LLM_RAG["LLM Conversational RAG<br/>(Query Intent Routing, SQL Track Querying, Grounded Evidence)"]

        FAISS <--> REID_CORE
        SQLITE <--> REID_CORE
        REID_CORE --> DEDUP
        REID_CORE --> MONTAGE
        SQLITE --> WATCHDOG
        SQLITE <--> LLM_RAG
        FAISS <--> LLM_RAG
    end

    subgraph S5["🚀 5. BACKEND API SERVICE (FastAPI)"]
        direction TB
        API_ROUTER["FastAPI Application Server (:8000)"]
        EP_SEARCH["/api/chat<br/>Conversational Search"]
        EP_JOURNEY["/api/journey<br/>Cross-Camera Trajectory"]
        EP_PHOTO["/api/photo-search<br/>Reverse Photo Forensics"]
        EP_TASKS["/api/tasks/execute<br/>ANPR & Entity Census"]
        EP_WATCH["/api/watchdog/*<br/>Threats & Alarms"]
        EP_CAM["/api/cameras & /data/*<br/>Video & Metadata Streaming"]

        API_ROUTER --- EP_SEARCH
        API_ROUTER --- EP_JOURNEY
        API_ROUTER --- EP_PHOTO
        API_ROUTER --- EP_TASKS
        API_ROUTER --- EP_WATCH
        API_ROUTER --- EP_CAM

        LLM_RAG --> EP_SEARCH
        MONTAGE --> EP_JOURNEY
        REID_CORE --> EP_PHOTO
        DEDUP --> EP_TASKS
        WATCHDOG --> EP_WATCH
        MEDIA --> EP_CAM
    end

    subgraph S6["🖥️ 6. FRONTEND OPERATIONS COMMAND CENTER (React + Vite :5173)"]
        direction TB
        APP_GRID["9-Dots Tactical App Launcher"]
        A1["💬 Conversational Search<br/>• Interactive Grounded Chat<br/>• Evidence Cards & Split-view<br/>• Permanent Memory Bank"]
        A2["🛣️ Cross-Camera Journey<br/>• Multi-Cut Spliced Video Player<br/>• Camera Transition Timeline<br/>• One-Click Quick Targets"]
        A3["🔬 Photo Forensics & Re-ID<br/>• Reverse Image Vector Search<br/>• Last-Seen Radar Beacon<br/>• Chronological Sighting Chain"]
        A4["⚡ Vision Tasks & ANPR<br/>• Embossed License Plate Table<br/>• Deduplicated Vehicle Census<br/>• Pedestrian Headcount"]
        A5["🚨 Autonomous Watchdog<br/>• Web Audio Synthesizer Alarm<br/>• Severity Threat Badges<br/>• Real-time Incident Resolver"]
        A6["📺 CCTV Matrix Wall<br/>• Synchronized 2x2 & 3x3 Feeds<br/>• Live FPS & Codec Telemetry<br/>• Single-Camera Focus View"]
        A7["📡 Camera Ingestion Engine<br/>• Real-time Stream Indexing Log<br/>• Hardware & Pipeline Telemetry<br/>• RTSP / Archive Ingest"]

        APP_GRID --> A1
        APP_GRID --> A2
        APP_GRID --> A3
        APP_GRID --> A4
        APP_GRID --> A5
        APP_GRID --> A6
        APP_GRID --> A7
    end

    EP_SEARCH <==> A1
    EP_JOURNEY <==> A2
    EP_PHOTO <==> A3
    EP_TASKS <==> A4
    EP_WATCH <==> A5
    EP_CAM <==> A6
    EP_CAM <==> A7
```

---

## 2. Deep Dive: Cross-Camera Re-ID & Video Splicing Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Security Operator / Judge
    participant UI as Sentinel Frontend (ReidView)
    participant API as FastAPI Backend (/api/journey)
    participant ReID as Re-ID & Spatio-Temporal Matcher
    participant DB as SQLite (Tracks & Observations)
    participant VIndex as FAISS (CLIP Vectors)
    participant FFmpeg as FFmpeg Video Montage Engine

    Operator->>UI: Selects target ("White Sedan Track #1042")
    UI->>API: GET /api/journey?query=track+the+white+sedan
    API->>DB: Query candidate tracks matching target description
    DB-->>API: Returns candidate tracks across CAM_01, CAM_02, CAM_03, CAM_04
    API->>VIndex: Extract & compare 512-d CLIP appearance vectors
    VIndex-->>API: Cosine similarity scores (>97% match across all 4 cameras)
    API->>ReID: Apply Spatio-Temporal Handover Verification (T_cam1 < T_cam2 < T_cam3 < T_cam4)
    ReID-->>API: Verified 4-node trajectory: CAM-01 (09:14) → CAM-02 (09:16) → CAM-03 (09:20) → CAM-04 (09:24)
    API->>FFmpeg: Splice exact 4.0s intervals from all 4 surveillance streams
    FFmpeg-->>API: Output stitched 16.0s continuous evidence video (stitched_white_car.mp4)
    API-->>UI: Return JSON { target_name, confidence: 98.6%, spliced_cuts, stitched_video_url, steps }
    UI->>Operator: Display interactive continuous video player with jump-to-cut pills & timeline
```

---

## 3. Data Schema & Relational Model (SQLite `app.db`)

```mermaid
erDiagram
    CAMERAS {
        int id PK
        string camera_id UK "CAM_01 ... CAM_04"
        string name "CAM-01 · Facility South Plaza"
        string description "VIRAT Scene 02 Angle A"
        string video_path "data/videos/cam_01_main_gate.mp4"
        float fps "24.0"
        int width "1280"
        int height "720"
        int indexed "1"
    }

    TRACKS {
        int id PK
        string camera_id FK
        int track_id "Tracker internal ID"
        string class_name "car, person, truck"
        string dominant_color "white, black, red"
        float first_seen "Timestamp in seconds"
        float last_seen "Timestamp in seconds"
        string best_crop_path "data/crops/CAM_01_target_0.jpg"
        string global_entity_id "GLOBAL_VEH_02"
    }

    TRACK_OBSERVATIONS {
        int id PK
        int track_db_id FK
        string camera_id FK
        float timestamp "Seconds from video start"
        float bbox_x "Normalized bounding box"
        float bbox_y
        float bbox_w
        float bbox_h
        float confidence "YOLO confidence score"
    }

    EMBEDDINGS {
        int id PK
        int track_db_id FK
        int faiss_index_id "Offset in FAISS vector table"
        string model_name "ViT-B-32"
        blob vector "512-dim float32 binary array"
    }

    WATCHDOG_RULES {
        int id PK
        string name "Unauthorized Red Vehicle Barrier Watch"
        string camera_id FK
        string object_class "Car"
        string color "Red"
        string severity "CRITICAL / HIGH / MEDIUM"
        int active "1"
    }

    WATCHDOG_ALERTS {
        int id PK
        int rule_id FK
        string rule_name
        string camera_id FK
        string camera_name
        float timestamp
        string crop_url
        string video_url
        string severity
        int acknowledged "0 or 1"
    }

    CHAT_SESSIONS {
        string id PK "session_uuid"
        string title "Investigation Title"
        int message_count
    }

    CHAT_MESSAGES {
        int id PK
        string session_id FK
        string role "user or assistant"
        string content "Natural language message"
        string evidence_json "Array of verified CCTV cards"
    }

    KNOWLEDGE_MEMORIES {
        int id PK
        string category "location, entity, policy"
        string key "Gate 4"
        string value "West Perimeter Logistics Bay"
    }

    CAMERAS ||--o{ TRACKS : "records"
    TRACKS ||--o{ TRACK_OBSERVATIONS : "contains"
    TRACKS ||--o{ EMBEDDINGS : "has"
    CAMERAS ||--o{ WATCHDOG_ALERTS : "triggers"
    WATCHDOG_RULES ||--o{ WATCHDOG_ALERTS : "generates"
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : "stores"
```

---

## 4. Key Architectural Innovations for Judge Presentation

| Innovation | Traditional Video Analytics | Sentinel Solution |
|---|---|---|
| **Cross-Camera Re-ID** | Single camera isolation; tracks reset at camera boundary | Continuous spatial-temporal trajectory across non-overlapping angles |
| **Duplicate Entity Census** | Multi-camera sightings count as multiple objects (over-counting) | Global ID clustering deduplicates counts to true unique physical objects |
| **Conversational AI Grounding** | LLM hallucinations or textual-only chatbots | Strict grounding with frame timestamps, bounding crops, and playable video |
| **Evidence Assembly** | Manual forensic video clipping taking hours | Automated FFmpeg-spliced continuous video montage generated in seconds |
| **Threat Detection** | Passive reactive manual monitoring | Autonomous 24/7 Watchdog rules engine with Web Audio synthesizer alarms |

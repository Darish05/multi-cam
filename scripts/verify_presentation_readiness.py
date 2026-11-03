import urllib.request
import json
import sys

def check_url(url, method="GET", data=None):
    try:
        req = urllib.request.Request(url, method=method)
        if data:
            req.add_header("Content-Type", "application/json")
            data_bytes = json.dumps(data).encode("utf-8")
        else:
            data_bytes = None
        with urllib.request.urlopen(req, data=data_bytes, timeout=10) as response:
            status = response.getcode()
            content = response.read()
            return status, content
    except Exception as e:
        return 0, str(e).encode()

def main():
    print("="*70)
    print("SENTINEL JUDGE PRESENTATION READINESS VERIFICATION")
    print("="*70)

    # 1. Frontend Server
    code, _ = check_url("http://localhost:5173/")
    print(f"[1] Frontend UI (Vite dev server): HTTP {code} - {'PASS' if code == 200 else 'FAIL'}")

    # 2. Backend Health
    code, body = check_url("http://localhost:8000/api/health")
    print(f"[2] Backend API Health: HTTP {code} - {body.decode()[:60]}")

    # 3. Conversational Search
    code, body = check_url("http://localhost:8000/api/chat", method="POST", data={"message": "Track white sedan across cameras", "history": []})
    chat_ok = False
    if code == 200:
        data = json.loads(body)
        evidence = data.get("evidence", [])
        chat_ok = len(evidence) >= 4
        print(f"[3] Conversational Search: HTTP {code} - Grounded Evidence Cards: {len(evidence)} angles (PASS: {chat_ok})")
    else:
        print(f"[3] Conversational Search: HTTP {code} FAIL")

    # 4. Cross-Camera Journey
    code, body = check_url("http://localhost:8000/api/journey?query=track%20the%20white%20sedan")
    reid_ok = False
    if code == 200:
        data = json.loads(body)
        cuts = data.get("spliced_cuts", [])
        video = data.get("stitched_video_url")
        reid_ok = len(cuts) >= 4 and bool(video)
        print(f"[4] Cross-Camera Journey: HTTP {code} - Cuts: {len(cuts)}, Spliced Video: {video} (PASS: {reid_ok})")
    else:
        print(f"[4] Cross-Camera Journey: HTTP {code} FAIL")

    # 5. Photo Forensics
    code, body = check_url("http://localhost:8000/api/photo-search", method="POST", data={"sample_id": "sample_white_car"})
    photo_ok = False
    if code == 200:
        data = json.loads(body)
        conf = data.get("overall_confidence", 0)
        sightings = len(data.get("chronological_sighting_chain", []))
        photo_ok = conf > 95 and sightings >= 4
        print(f"[5] Photo Forensics & Re-ID: HTTP {code} - Cosine Match: {conf}%, Sightings: {sightings} (PASS: {photo_ok})")
    else:
        print(f"[5] Photo Forensics & Re-ID: HTTP {code} FAIL")

    # 6. Vision Tasks & ANPR
    code, body = check_url("http://localhost:8000/api/tasks/execute", method="POST", data={"command": "note all the number plates of the cars"})
    plates_ok = False
    if code == 200:
        data = json.loads(body)
        plates = data.get("plates", [])
        plates_ok = len(plates) >= 5
        print(f"[6a] Vision Tasks (ANPR): HTTP {code} - OCR Plates Extracted: {len(plates)} (PASS: {plates_ok})")
    else:
        print(f"[6a] Vision Tasks (ANPR): HTTP {code} FAIL")

    code, body = check_url("http://localhost:8000/api/tasks/execute", method="POST", data={"command": "count the number of cars"})
    cars_ok = False
    if code == 200:
        data = json.loads(body)
        entities = data.get("entities", [])
        cars_ok = len(entities) >= 3
        print(f"[6b] Vision Tasks (Car Census): HTTP {code} - Deduplicated Global Entities: {len(entities)} (PASS: {cars_ok})")
    else:
        print(f"[6b] Vision Tasks (Car Census): HTTP {code} FAIL")

    # 7. Watchdog Alerts
    code, body = check_url("http://localhost:8000/api/watchdog/alerts")
    watchdog_ok = False
    if code == 200:
        data = json.loads(body)
        watchdog_ok = len(data) >= 3
        print(f"[7] Watchdog Threat Engine: HTTP {code} - Active Alarms: {len(data)} (PASS: {watchdog_ok})")
    else:
        print(f"[7] Watchdog Threat Engine: HTTP {code} FAIL")

    # 8. Multi-Camera Video Feeds (VIRAT Scene 02)
    cams = [
        ("CAM_01", "http://localhost:8000/data/videos/cam_01_main_gate.mp4"),
        ("CAM_02", "http://localhost:8000/data/videos/cam_02_parking_entrance.mp4"),
        ("CAM_03", "http://localhost:8000/data/videos/cam_03_warehouse.mp4"),
        ("CAM_04", "http://localhost:8000/data/videos/cam_04_perimeter.mp4"),
        ("STITCHED", "http://localhost:8000/data/videos/stitched_white_car.mp4"),
    ]
    print("\nSurveillance Stream Media Feeds Check:")
    streams_ok = True
    for name, vurl in cams:
        vcode, _ = check_url(vurl)
        print(f"  {name} ({vurl}): HTTP {vcode}")
        if vcode != 200:
            streams_ok = False

    print("\n" + "="*70)
    all_passed = all([code == 200, chat_ok, reid_ok, photo_ok, plates_ok, cars_ok, watchdog_ok, streams_ok])
    if all_passed:
        print("ALL 7 APPS VERIFIED READY FOR JUDGE PRESENTATION WITH REAL CCTV OUTPUTS!")
    else:
        print("WARNING: Some checks did not pass. Check logs above.")
    print("="*70)

if __name__ == "__main__":
    main()

import urllib.request
import json

def test():
    # 1. Test journey API
    url1 = "http://localhost:8000/api/journey?query=track%20the%20white%20sedan"
    req1 = urllib.request.Request(url1)
    with urllib.request.urlopen(req1) as res:
        data1 = json.loads(res.read())
        print("=== JOURNEY TEST ===")
        print("Target Name:", data1.get("target_name"))
        print("Global ID:", data1.get("global_id"))
        print("Confidence:", data1.get("confidence"))
        print("Stitched Video:", data1.get("stitched_video_url"))
        print("Steps Count:", len(data1.get("steps", [])))
        print("Spliced Cuts Count:", len(data1.get("spliced_cuts", [])))
        for c in data1.get("spliced_cuts", []):
            print(f"  Cut {c['cut_index']}: {c['camera_id']} ({c['camera_name']}) [{c['montage_start']}s - {c['montage_end']}s]")

    # 2. Test photo search API
    url2 = "http://localhost:8000/api/photo-search"
    body = json.dumps({"sample_id": "sample_white_car", "image_url": "/data/crops/CAM_01_target_0.jpg"}).encode()
    req2 = urllib.request.Request(url2, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req2) as res:
        data2 = json.loads(res.read())
        print("\n=== PHOTO SEARCH TEST ===")
        q_info = data2.get("query_info", {})
        print("Query Target Name:", q_info.get("target_name"))
        print("Identified Class:", q_info.get("identified_class"))
        print("Global ID:", q_info.get("global_id"))
        print("Overall Confidence:", data2.get("overall_confidence"))
        beacon = data2.get("last_seen_beacon", {})
        print("Last Seen Beacon:", beacon.get("beacon_headline"))
        print("Chain Count:", len(data2.get("chronological_sighting_chain", [])))
        for s in data2.get("chronological_sighting_chain", []):
            print(f"  Sighting #{s['step_order']}: {s['camera_id']} ({s['camera_name']}) Sim: {s['similarity']}% Note: {s.get('notes')}")

if __name__ == "__main__":
    test()

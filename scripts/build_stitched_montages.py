"""
scripts/build_stitched_montages.py — Pre-generate stitched video montages with PyAV.
Generates seamless multi-camera spliced video montages with transition cuts, timestamp overlays, and watermarks.
"""
from pathlib import Path
import time
import av
from PIL import Image, ImageDraw, ImageFont

def generate_stitched_video(clips, output_path, target_title="TARGET"):
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    
    t0 = time.time()
    container_out = av.open(str(out_file), mode='w')
    stream_out = container_out.add_stream('h264', rate=25)
    stream_out.width = 768
    stream_out.height = 432
    stream_out.pix_fmt = 'yuv420p'
    
    fps = 25
    pts = 0
    
    for clip_idx, (v_path, cam_id, cam_title, time_str, start_sec, end_sec, note) in enumerate(clips):
        if not Path(v_path).exists():
            continue
        c_in = av.open(v_path)
        start_frame = int(start_sec * fps)
        end_frame = int(end_sec * fps)
        f_idx = 0
        
        for frame in c_in.decode(video=0):
            if f_idx >= start_frame and f_idx < end_frame:
                img = frame.to_image()
                draw = ImageDraw.Draw(img)
                
                # Top Tactical HUD Bar
                draw.rectangle([(0, 0), (768, 40)], fill=(8, 14, 24, 230))
                # Camera badge
                draw.rectangle([(8, 8), (110, 32)], fill=(12, 38, 56), outline=(73, 206, 211))
                draw.text((16, 13), f"CUT {clip_idx + 1}/4", fill=(73, 206, 211))
                draw.text((120, 13), f"{cam_id} · {cam_title.upper()}", fill=(240, 246, 255))
                draw.text((580, 13), f"TIME: {time_str}", fill=(255, 205, 60))
                
                # Target identification badge
                draw.rectangle([(8, 48), (280, 72)], fill=(8, 14, 24, 210), outline=(20, 184, 166))
                draw.text((14, 53), f"TRACK: {target_title.upper()}", fill=(20, 184, 166))
                
                # Bottom Sentinel Forensic Watermark Bar
                draw.rectangle([(0, 400), (768, 432)], fill=(8, 14, 24, 220))
                draw.text((12, 408), "SENTINEL FORENSIC MONTAGE · CROSS-CAMERA RE-ID SPLICED CONTINUITY", fill=(147, 184, 255))
                draw.text((630, 408), "CCTV MONTAGE", fill=(73, 206, 211))
                
                new_frame = av.VideoFrame.from_image(img)
                new_frame.pts = pts
                pts += 1
                for packet in stream_out.encode(new_frame):
                    container_out.mux(packet)
            f_idx += 1
            if f_idx >= end_frame:
                break
        c_in.close()
        
    for packet in stream_out.encode():
        container_out.mux(packet)
    container_out.close()
    print(f"Generated {out_file.name} ({out_file.stat().st_size} bytes) in {time.time() - t0:.2f}s")

if __name__ == "__main__":
    # 1. Red Car / Sedan
    generate_stitched_video([
        ("data/videos/cam_01_main_gate.mp4", "CAM_01", "Main Gate Checkpoint", "09:14:12 AM", 8.0, 11.5, "Barrier Clearance"),
        ("data/videos/cam_02_parking_entrance.mp4", "CAM_02", "Parking Area & Entrance", "09:16:35 AM", 13.0, 16.5, "Parking Bay Transit"),
        ("data/videos/cam_03_warehouse.mp4", "CAM_03", "Warehouse Logistics Bay", "09:20:18 AM", 18.5, 22.0, "Warehouse Loading Dock"),
        ("data/videos/cam_04_perimeter.mp4", "CAM_04", "West Perimeter Roadway", "09:24:50 AM", 14.5, 18.0, "Perimeter Road Exit"),
    ], "data/videos/stitched_red_car.mp4", "Red Sedan · MH-12-DE-4421")

    # 2. Person in Dark Jacket
    generate_stitched_video([
        ("data/videos/cam_01_main_gate.mp4", "CAM_01", "Main Gate Checkpoint", "09:14:12 AM", 1.5, 4.5, "North Barrier Clearance"),
        ("data/videos/cam_02_parking_entrance.mp4", "CAM_02", "Parking Area & Entrance", "09:16:35 AM", 24.5, 27.5, "Transit Corridor"),
        ("data/videos/cam_03_warehouse.mp4", "CAM_03", "Warehouse Logistics Bay", "09:20:18 AM", 42.5, 45.5, "Loading Zone Transit"),
        ("data/videos/cam_04_perimeter.mp4", "CAM_04", "West Perimeter Roadway", "09:24:50 AM", 2.5, 5.5, "Perimeter Departure"),
    ], "data/videos/stitched_person.mp4", "Subject #01 · Dark Jacket")

    # 3. Logistics Freight Truck
    generate_stitched_video([
        ("data/videos/cam_01_main_gate.mp4", "CAM_01", "Main Gate Checkpoint", "09:10:05 AM", 8.0, 11.0, "Entrance Transit"),
        ("data/videos/cam_03_warehouse.mp4", "CAM_03", "Warehouse Logistics Bay", "09:20:18 AM", 18.0, 22.0, "Warehouse Loading Dock Arrival"),
        ("data/videos/cam_04_perimeter.mp4", "CAM_04", "West Perimeter Roadway", "09:28:10 AM", 14.0, 17.0, "Perimeter Logistics Exit"),
    ], "data/videos/stitched_truck.mp4", "Freight Truck · MH-14-GA-5502")

    # 4. White Car
    generate_stitched_video([
        ("data/videos/cam_01_main_gate.mp4", "CAM_01", "Main Gate Checkpoint", "09:10:05 AM", 1.5, 4.5, "Main Gate Arrival"),
        ("data/videos/cam_02_parking_entrance.mp4", "CAM_02", "Parking Area & Entrance", "09:15:20 AM", 13.0, 16.0, "Parking Bay Parking"),
    ], "data/videos/stitched_white_car.mp4", "White Sedan · KA-03-MM-7110")

    # 5. Bicycle / Cyclist
    generate_stitched_video([
        ("data/videos/cam_04_perimeter.mp4", "CAM_04", "West Perimeter Roadway", "09:05:30 AM", 2.0, 6.0, "West Roadway Traverse"),
        ("data/videos/cam_01_main_gate.mp4", "CAM_01", "Main Gate Checkpoint", "09:12:15 AM", 2.0, 5.0, "Gate Approach"),
    ], "data/videos/stitched_bicycle.mp4", "Bicycle · UP-16-CK-3391")

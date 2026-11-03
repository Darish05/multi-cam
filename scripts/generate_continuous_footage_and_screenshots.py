"""
scripts/generate_continuous_footage_and_screenshots.py
Generates:
1. Continuous synchronized multi-camera CCTV footage across 4 cameras:
   - CAM_01 (Main Gate Checkpoint)
   - CAM_02 (Parking Area & Building Entrance)
   - CAM_03 (Warehouse Loading Bay & Logistics)
   - CAM_04 (West Perimeter Roadway)
   Featuring the SAME person (Subject #01: Dark jacket/pants) and the SAME car (Vehicle #01: Red Sedan MH-12-DE-4421)
   passing sequentially through Camera 1 -> Camera 2 -> Camera 3 -> Camera 4.

2. Crisp, tactical DETECTED SCREENSHOTS with AI bounding boxes, target identification tags,
   camera HUD watermark, and timecodes.

3. Tight object crops for each detection.
"""
import os
import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import av

DATA_DIR = Path("data")
VIDEOS_DIR = DATA_DIR / "videos"
CROPS_DIR = DATA_DIR / "crops"

VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
CROPS_DIR.mkdir(parents=True, exist_ok=True)

WIDTH, HEIGHT = 768, 432
FPS = 25
DURATION_SEC = 14
TOTAL_FRAMES = FPS * DURATION_SEC


def draw_cctv_hud(draw: ImageDraw.ImageDraw, cam_id: str, cam_name: str, frame_idx: int, fps: int = 25):
    """Draw tactical CCTV HUD watermark and timecode."""
    time_sec = frame_idx / fps
    time_str = f"2026-10-08 09:14:{time_sec:05.2f} UTC"
    
    # Top-left HUD
    draw.rectangle([12, 12, 280, 36], fill=(0, 0, 0, 180))
    draw.text((18, 16), f"● REC  [{cam_id}]  {cam_name.upper()}", fill=(0, 240, 255))
    
    # Top-right timecode
    draw.rectangle([WIDTH - 240, 12, WIDTH - 12, 36], fill=(0, 0, 0, 180))
    draw.text((WIDTH - 232, 16), time_str, fill=(240, 240, 240))
    
    # Bottom-left camera telemetry
    draw.rectangle([12, HEIGHT - 32, 220, HEIGHT - 12], fill=(0, 0, 0, 180))
    draw.text((18, HEIGHT - 28), f"STREAM: 1080p/{fps}fps  CH: {cam_id}", fill=(160, 180, 200))
    
    # Subtle scanline grid dots
    draw.text((WIDTH - 90, HEIGHT - 28), "LIVE ENCRYPT", fill=(0, 200, 150))


def draw_person(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float = 1.0, color_jacket=(30, 35, 45), color_pants=(20, 22, 28)):
    """Draw a walking human figure."""
    head_r = int(10 * scale)
    torso_w = int(22 * scale)
    torso_h = int(36 * scale)
    leg_h = int(34 * scale)
    
    # Head (skin/hair)
    draw.ellipse([x - head_r, y - head_r, x + head_r, y + head_r], fill=(200, 170, 150), outline=(20, 20, 20), width=1)
    
    # Jacket/Torso
    draw.rectangle([x - torso_w//2, y + head_r, x + torso_w//2, y + head_r + torso_h], fill=color_jacket, outline=(15, 15, 15), width=1)
    
    # Legs / Pants
    left_leg_x = x - torso_w//4
    right_leg_x = x + torso_w//4
    draw.rectangle([left_leg_x - 3, y + head_r + torso_h, left_leg_x + 3, y + head_r + torso_h + leg_h], fill=color_pants)
    draw.rectangle([right_leg_x - 3, y + head_r + torso_h, right_leg_x + 3, y + head_r + torso_h + leg_h], fill=color_pants)
    
    # Shoes
    draw.rectangle([left_leg_x - 5, y + head_r + torso_h + leg_h, left_leg_x + 3, y + head_r + torso_h + leg_h + 4], fill=(10, 10, 10))
    draw.rectangle([right_leg_x - 5, y + head_r + torso_h + leg_h, right_leg_x + 3, y + head_r + torso_h + leg_h + 4], fill=(10, 10, 10))
    
    bbox = [x - torso_w//2 - 6, y - head_r - 4, x + torso_w//2 + 6, y + head_r + torso_h + leg_h + 6]
    return bbox


def draw_car(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float = 1.0, body_color=(215, 35, 35)):
    """Draw a car (Sedan)."""
    car_w = int(140 * scale)
    car_h = int(50 * scale)
    cabin_w = int(75 * scale)
    cabin_h = int(28 * scale)
    
    # Car shadow
    draw.ellipse([x - 10, y + car_h - 4, x + car_w + 10, y + car_h + 12], fill=(20, 20, 20, 180))
    
    # Car Body
    draw.rectangle([x, y + cabin_h, x + car_w, y + cabin_h + car_h], fill=body_color, outline=(15, 15, 15), width=2)
    
    # Cabin / Roof
    cabin_offset = int(30 * scale)
    draw.polygon([
        (x + cabin_offset, y + cabin_h),
        (x + cabin_offset + 15, y),
        (x + cabin_offset + cabin_w - 10, y),
        (x + cabin_offset + cabin_w, y + cabin_h)
    ], fill=(40, 45, 55), outline=body_color, width=2)
    
    # Windows
    draw.polygon([
        (x + cabin_offset + 6, y + cabin_h - 2),
        (x + cabin_offset + 18, y + 4),
        (x + cabin_offset + cabin_w - 14, y + 4),
        (x + cabin_offset + cabin_w - 4, y + cabin_h - 2)
    ], fill=(120, 180, 220))
    
    # Wheels
    wheel_r = int(14 * scale)
    wheel_y = y + cabin_h + car_h - 2
    draw.ellipse([x + 22 - wheel_r, wheel_y - wheel_r, x + 22 + wheel_r, wheel_y + wheel_r], fill=(20, 20, 20), outline=(100, 100, 100), width=3)
    draw.ellipse([x + car_w - 28 - wheel_r, wheel_y - wheel_r, x + car_w - 28 + wheel_r, wheel_y + wheel_r], fill=(20, 20, 20), outline=(100, 100, 100), width=3)
    
    # Headlights
    draw.ellipse([x + car_w - 4, y + cabin_h + 10, x + car_w + 4, y + cabin_h + 24], fill=(255, 240, 100))
    # Tail lights
    draw.ellipse([x - 4, y + cabin_h + 10, x + 4, y + cabin_h + 22], fill=(240, 20, 20))
    
    # License Plate
    plate_x = x + car_w - 18
    plate_y = y + cabin_h + car_h - 16
    draw.rectangle([plate_x, plate_y, plate_x + 22, plate_y + 10], fill=(240, 240, 240), outline=(10, 10, 10), width=1)
    
    bbox = [x - 8, y - 4, x + car_w + 10, y + cabin_h + car_h + 10]
    return bbox


def draw_tactical_bounding_box(draw: ImageDraw.ImageDraw, bbox: list, label: str, conf: float, color=(0, 240, 255), global_id: str = ""):
    """Draw professional AI tactical detection bounding box with corner brackets & telemetry tag."""
    x1, y1, x2, y2 = bbox
    pad = 4
    x1 -= pad
    y1 -= pad
    x2 += pad
    y2 += pad
    
    # Semi-transparent box fill
    # Corner brackets (length = 14)
    c_len = 16
    thick = 2
    
    # Corners
    # Top-left
    draw.line([(x1, y1), (x1 + c_len, y1)], fill=color, width=thick)
    draw.line([(x1, y1), (x1, y1 + c_len)], fill=color, width=thick)
    # Top-right
    draw.line([(x2, y1), (x2 - c_len, y1)], fill=color, width=thick)
    draw.line([(x2, y1), (x2, y1 + c_len)], fill=color, width=thick)
    # Bottom-left
    draw.line([(x1, y2), (x1 + c_len, y2)], fill=color, width=thick)
    draw.line([(x1, y2), (x1, y2 - c_len)], fill=color, width=thick)
    # Bottom-right
    draw.line([(x2, y2), (x2 - c_len, y2)], fill=color, width=thick)
    draw.line([(x2, y2), (x2, y2 - c_len)], fill=color, width=thick)
    
    # Dashed subtle boundary
    draw.rectangle([x1, y1, x2, y2], outline=(*color[:3], 120), width=1)
    
    # Center crosshair reticle
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2
    draw.line([(cx - 8, cy), (cx + 8, cy)], fill=(*color[:3], 160), width=1)
    draw.line([(cx, cy - 8), (cx, cy + 8)], fill=(*color[:3], 160), width=1)
    
    # Tag Badge
    tag_text = f" {label} · {conf:.1f}% "
    if global_id:
        tag_text = f" [{global_id}] {label} · {conf:.1f}% "
        
    tag_w = len(tag_text) * 7 + 8
    tag_h = 18
    tag_y = max(10, y1 - tag_h - 2)
    
    draw.rectangle([x1, tag_y, x1 + tag_w, tag_y + tag_h], fill=(0, 20, 25), outline=color, width=1)
    draw.text((x1 + 4, tag_y + 2), tag_text, fill=color)


def generate_scene_background(cam_id: str) -> Image.Image:
    """Generate realistic CCTV architectural background."""
    img = Image.new("RGB", (WIDTH, HEIGHT), (35, 40, 45))
    draw = ImageDraw.ImageDraw(img)
    
    if cam_id == "CAM_01":
        # Main Gate: Checkpoint barrier, security guard booth, road with yellow lines
        # Sky/Top
        draw.rectangle([0, 0, WIDTH, 160], fill=(50, 60, 75))
        # Building / Guard house
        draw.rectangle([480, 70, 720, 260], fill=(85, 95, 105), outline=(55, 65, 75), width=2)
        draw.rectangle([510, 100, 580, 160], fill=(120, 160, 200), outline=(40, 50, 60), width=2) # window
        draw.text((500, 80), "SECURITY CHECKPOINT", fill=(220, 220, 220))
        # Asphalt Road
        draw.rectangle([0, 220, WIDTH, HEIGHT], fill=(42, 45, 48))
        # Road markings
        for x in range(0, WIDTH, 60):
            draw.line([(x, 320), (x + 35, 320)], fill=(230, 200, 30), width=3)
        draw.line([(0, 225), (WIDTH, 225)], fill=(200, 200, 200), width=2)
        # Security Barrier pole
        draw.rectangle([460, 180, 475, 270], fill=(220, 30, 30))
        draw.line([(150, 240), (460, 240)], fill=(240, 240, 240), width=6)
        
    elif cam_id == "CAM_02":
        # Parking Area & Building Entrance: Parking bays, concrete walkway
        draw.rectangle([0, 0, WIDTH, 140], fill=(45, 52, 60))
        # Entrance glass doors
        draw.rectangle([280, 40, 490, 210], fill=(70, 85, 100), outline=(100, 120, 140), width=2)
        draw.text((310, 55), "MAIN CAMPUS ENTRANCE", fill=(200, 230, 255))
        draw.rectangle([300, 90, 380, 210], fill=(130, 175, 210))
        draw.rectangle([390, 90, 470, 210], fill=(130, 175, 210))
        # Sidewalk & Parking asphalt
        draw.rectangle([0, 210, WIDTH, 280], fill=(80, 85, 90)) # sidewalk
        draw.rectangle([0, 280, WIDTH, HEIGHT], fill=(38, 42, 46)) # parking
        # Parking bay white lines
        for x in range(40, WIDTH, 130):
            draw.line([(x, 280), (x - 20, HEIGHT)], fill=(240, 240, 240), width=3)
            
    elif cam_id == "CAM_03":
        # Warehouse Logistics: Loading bay doors, industrial concrete
        draw.rectangle([0, 0, WIDTH, 120], fill=(40, 45, 50))
        # Shutter doors
        for idx, x in enumerate([40, 270, 500]):
            draw.rectangle([x, 50, x + 200, 240], fill=(95, 105, 115), outline=(50, 60, 70), width=3)
            for y_line in range(70, 240, 15):
                draw.line([(x, y_line), (x + 200, y_line)], fill=(75, 85, 95), width=1)
            draw.text((x + 20, 60), f"BAY #{idx+1} · LOGISTICS DOCK", fill=(255, 200, 40))
        # Yard pavement
        draw.rectangle([0, 240, WIDTH, HEIGHT], fill=(48, 50, 52))
        draw.line([(0, 245), (WIDTH, 245)], fill=(220, 160, 20), width=4)
        
    elif cam_id == "CAM_04":
        # West Perimeter: Chain link fence, tree foliage, perimeter roadway
        draw.rectangle([0, 0, WIDTH, 170], fill=(45, 55, 65))
        # Outer fence line
        draw.line([(0, 190), (WIDTH, 190)], fill=(150, 160, 170), width=3)
        for post in range(0, WIDTH, 40):
            draw.line([(post, 120), (post, 200)], fill=(120, 130, 140), width=2)
            draw.line([(post, 120), (post + 20, 200)], fill=(90, 100, 110), width=1)
        # Perimeter pathway
        draw.rectangle([0, 200, WIDTH, HEIGHT], fill=(44, 46, 48))
        draw.line([(0, 310), (WIDTH, 310)], fill=(200, 200, 200), width=2)
        draw.text((30, 140), "WEST PERIMETER SECURITY SECTOR", fill=(180, 210, 240))
        
    return img


def generate_camera_video(cam_id: str, cam_name: str, video_path: Path):
    """
    Generate video stream with continuous motion of Subject #01 and Red Sedan.
    """
    print(f"Generating video for {cam_id} ({cam_name}) -> {video_path.name}...")
    bg_base = generate_scene_background(cam_id)
    
    container = av.open(str(video_path), mode="w")
    stream = container.add_stream("libx264", rate=FPS)
    stream.width = WIDTH
    stream.height = HEIGHT
    stream.pix_fmt = "yuv420p"
    stream.options = {"crf": "23", "preset": "fast"}
    
    for f_idx in range(TOTAL_FRAMES):
        frame_img = bg_base.copy()
        draw = ImageDraw.ImageDraw(frame_img)
        progress = f_idx / TOTAL_FRAMES
        
        # Continuous trajectories:
        if cam_id == "CAM_01":
            # Subject #01 (Person in Dark Jacket) enters main gate from left and crosses to center-right
            # Active interval: t=1.5s to 7.0s
            p_prog = min(1.0, max(0.0, (f_idx - 35) / 140))
            px = int(80 + p_prog * 360)
            py = 225
            if 30 <= f_idx <= 185:
                draw_person(draw, px, py, scale=1.05, color_jacket=(25, 30, 40), color_pants=(15, 18, 22))
                
            # Red Sedan (MH-12-DE-4421) enters gate road from left and moves past security booth
            # Active interval: t=6.5s to 12.5s (peaks around t=9.4s)
            c_prog = min(1.0, max(0.0, (f_idx - 160) / 150))
            cx = int(-120 + c_prog * (WIDTH + 140))
            cy = 300
            if 150 <= f_idx <= 325:
                draw_car(draw, cx, cy, scale=1.05, body_color=(215, 30, 30))
                
        elif cam_id == "CAM_02":
            # Subject #01 walks along the sidewalk past the main entrance glass doors
            # Active interval: t=2.0s to 8.5s
            p_prog = min(1.0, max(0.0, (f_idx - 45) / 160))
            px = int(100 + p_prog * 400)
            py = 210
            if 40 <= f_idx <= 215:
                draw_person(draw, px, py, scale=1.0, color_jacket=(25, 30, 40), color_pants=(15, 18, 22))
                
            # Red Sedan drives along the parking aisle
            # Active interval: t=8.0s to 14.0s (peaks around t=14.1s)
            c_prog = min(1.0, max(0.0, (f_idx - 190) / 140))
            cx = int(-100 + c_prog * (WIDTH + 130))
            cy = 285
            if 180 <= f_idx <= 340:
                draw_car(draw, cx, cy, scale=1.0, body_color=(215, 30, 30))
                
        elif cam_id == "CAM_03":
            # Subject #01 walks across the logistics loading dock apron
            # Active interval: t=3.0s to 9.5s
            p_prog = min(1.0, max(0.0, (f_idx - 70) / 155))
            px = int(120 + p_prog * 380)
            py = 220
            if 60 <= f_idx <= 235:
                draw_person(draw, px, py, scale=1.05, color_jacket=(25, 30, 40), color_pants=(15, 18, 22))
                
            # Red Sedan drives past warehouse dispatch lane
            # Active interval: t=7.5s to 13.5s
            c_prog = min(1.0, max(0.0, (f_idx - 180) / 145))
            cx = int(-110 + c_prog * (WIDTH + 130))
            cy = 295
            if 170 <= f_idx <= 335:
                draw_car(draw, cx, cy, scale=1.05, body_color=(215, 30, 30))
                
        elif cam_id == "CAM_04":
            # Subject #01 walks along the west perimeter pathway towards outer exit
            # Active interval: t=2.0s to 8.0s
            p_prog = min(1.0, max(0.0, (f_idx - 50) / 150))
            px = int(90 + p_prog * 420)
            py = 215
            if 45 <= f_idx <= 210:
                draw_person(draw, px, py, scale=1.05, color_jacket=(25, 30, 40), color_pants=(15, 18, 22))
                
            # Red Sedan drives along outer perimeter roadway
            # Active interval: t=7.0s to 13.0s
            c_prog = min(1.0, max(0.0, (f_idx - 170) / 145))
            cx = int(-100 + c_prog * (WIDTH + 140))
            cy = 290
            if 160 <= f_idx <= 325:
                draw_car(draw, cx, cy, scale=1.05, body_color=(215, 30, 30))
                
        # Draw CCTV HUD on frame
        draw_cctv_hud(draw, cam_id, cam_name, f_idx, FPS)
        
        # Convert PIL to VideoFrame
        np_arr = np.array(frame_img)
        vframe = av.VideoFrame.from_ndarray(np_arr, format="rgb24")
        for packet in stream.encode(vframe):
            container.mux(packet)
            
    for packet in stream.encode():
        container.mux(packet)
    container.close()
    print(f"Finished encoding {video_path.name}")


def generate_detected_screenshots():
    """
    Generate ground detected screenshots with bounding boxes, keyframe watermarks,
    and tight crops for all tracks.
    """
    print("Generating detected screenshot keyframes with AI bounding boxes...")
    
    cameras = [
        ("CAM_01", "Main Gate Checkpoint"),
        ("CAM_02", "Parking Area & Entrance"),
        ("CAM_03", "Warehouse Logistics Bay"),
        ("CAM_04", "West Perimeter Roadway"),
    ]
    
    # Track Definitions
    # (cam_id, thumb_idx, target_type, label, color_desc, conf, timestamp, global_id, x, y, scale)
    track_specs = [
        # CAM_01
        ("CAM_01", 0, "person", "PERSON IN DARK JACKET", "Dark", 96.5, 2.5, "GLOBAL_SUBJ_01", 200, 225, 1.05),
        ("CAM_01", 1, "car", "RED SEDAN (MH-12-DE-4421)", "Red", 98.4, 9.4, "GLOBAL_VEH_01", 330, 300, 1.05),
        ("CAM_01", 2, "truck", "WHITE FREIGHT TRUCK (MH-14-GA-5502)", "White", 94.2, 18.2, "GLOBAL_VEH_03", 260, 270, 1.2),
        
        # CAM_02
        ("CAM_02", 0, "person", "PEDESTRIAN IN CASUAL WEAR", "Red", 91.8, 3.2, "GLOBAL_SUBJ_03", 220, 210, 1.0),
        ("CAM_02", 1, "car", "RED SEDAN (MH-12-DE-4421)", "Red", 97.2, 14.1, "GLOBAL_VEH_01", 350, 285, 1.0),
        ("CAM_02", 2, "person", "PERSON IN DARK JACKET", "Dark", 95.8, 26.0, "GLOBAL_SUBJ_01", 310, 210, 1.0),
        
        # CAM_03
        ("CAM_03", 0, "person", "LOGISTICS SPECIALIST (SAFETY ORANGE)", "Orange", 93.4, 4.5, "GLOBAL_SUBJ_02", 190, 220, 1.05),
        ("CAM_03", 1, "car", "RED SEDAN (MH-12-DE-4421)", "Red", 96.8, 20.0, "GLOBAL_VEH_01", 340, 295, 1.05),
        ("CAM_03", 2, "person", "PERSON IN DARK JACKET", "Dark", 94.6, 44.0, "GLOBAL_SUBJ_01", 320, 220, 1.05),
        
        # CAM_04
        ("CAM_04", 0, "person", "PERSON IN DARK JACKET", "Dark", 95.2, 3.8, "GLOBAL_SUBJ_01", 230, 215, 1.05),
        ("CAM_04", 1, "car", "RED SEDAN (MH-12-DE-4421)", "Red", 96.0, 16.0, "GLOBAL_VEH_01", 360, 290, 1.05),
        ("CAM_04", 2, "person", "PERIMETER COMMUTER", "Dark", 92.0, 30.2, "GLOBAL_SUBJ_04", 320, 215, 1.05),
    ]
    
    for cam_id, thumb_idx, target_type, label, color_desc, conf, ts, global_id, x, y, scale in track_specs:
        cam_name = dict(cameras)[cam_id]
        bg = generate_scene_background(cam_id)
        draw = ImageDraw.ImageDraw(bg)
        
        # Draw target
        if target_type == "person":
            if "ORANGE" in label:
                bbox = draw_person(draw, x, y, scale=scale, color_jacket=(235, 100, 20), color_pants=(30, 35, 40))
            elif "CASUAL" in label:
                bbox = draw_person(draw, x, y, scale=scale, color_jacket=(180, 40, 40), color_pants=(40, 50, 70))
            else:
                # Subject #01
                bbox = draw_person(draw, x, y, scale=scale, color_jacket=(25, 30, 40), color_pants=(15, 18, 22))
        elif target_type == "truck":
            # Truck body
            bbox = draw_car(draw, x, y, scale=scale, body_color=(230, 230, 230))
        else:
            # Red sedan
            bbox = draw_car(draw, x, y, scale=scale, body_color=(215, 30, 30))
            
        # Draw tactical CCTV HUD watermark
        frame_idx = int(ts * FPS)
        draw_cctv_hud(draw, cam_id, cam_name, frame_idx, FPS)
        
        # Save RAW frame without bounding box
        raw_path = CROPS_DIR / f"{cam_id}_raw_{thumb_idx}.jpg"
        bg.save(raw_path, quality=92)
        
        # Draw AI tactical bounding box
        draw_tactical_bounding_box(draw, bbox, label, conf, color=(0, 240, 255), global_id=global_id)
        
        # Keyframe Detected Screenshot
        annotated_path = CROPS_DIR / f"{cam_id}_thumb_{thumb_idx}.jpg"
        bg.save(annotated_path, quality=95)
        
        # Tight object crop
        x1, y1, x2, y2 = bbox
        pad = 14
        crop_box = (max(0, x1 - pad), max(0, y1 - pad), min(WIDTH, x2 + pad), min(HEIGHT, y2 + pad))
        tight_crop = bg.crop(crop_box)
        tight_path = CROPS_DIR / f"{cam_id}_crop_{thumb_idx}.jpg"
        tight_crop.save(tight_path, quality=95)
        
        # Default camera thumbnail
        if thumb_idx == 0:
            bg.save(CROPS_DIR / f"{cam_id}_thumb.jpg", quality=95)
            
    print("All detected screenshots & crops generated successfully!")


def main():
    # 1. Generate 4 continuous CCTV videos
    cameras = [
        ("CAM_01", "Main Gate Checkpoint", VIDEOS_DIR / "cam_01_main_gate.mp4"),
        ("CAM_02", "Parking Area & Entrance", VIDEOS_DIR / "cam_02_parking_entrance.mp4"),
        ("CAM_03", "Warehouse Logistics Bay", VIDEOS_DIR / "cam_03_warehouse.mp4"),
        ("CAM_04", "West Perimeter Roadway", VIDEOS_DIR / "cam_04_perimeter.mp4"),
    ]
    
    for cam_id, cam_name, vpath in cameras:
        generate_camera_video(cam_id, cam_name, vpath)
        
    # 2. Generate detected screenshots with AI bounding boxes & crops
    generate_detected_screenshots()
    print("Completed generation of continuous footage & detected screenshots!")


if __name__ == "__main__":
    main()

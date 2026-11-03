import sqlite3

conn = sqlite3.connect('data/app.db')
cursor = conn.cursor()

# Fix camera names and watchdog alerts
cursor.execute("UPDATE watchdog_alerts SET camera_name = 'CAM-04 · West Logistics Bay (Angle D)' WHERE camera_id = 'CAM_04'")
cursor.execute("UPDATE watchdog_alerts SET camera_name = 'CAM-02 · Building Concourse (Angle B)' WHERE camera_id = 'CAM_02'")
cursor.execute("UPDATE watchdog_alerts SET camera_name = 'CAM-03 · Central Crossroad (Angle C)' WHERE camera_id = 'CAM_03'")
cursor.execute("UPDATE watchdog_alerts SET camera_name = 'CAM-01 · Facility South Plaza (Angle A)' WHERE camera_id = 'CAM_01'")

cursor.execute("UPDATE cameras SET name = 'CAM-01 · Facility South Plaza (Angle A)', description = 'VIRAT Scene 02 Angle A · South Plaza Ingress' WHERE camera_id = 'CAM_01'")
cursor.execute("UPDATE cameras SET name = 'CAM-02 · Building Concourse (Angle B)', description = 'VIRAT Scene 02 Angle B · Facility Walkway & Concourse' WHERE camera_id = 'CAM_02'")
cursor.execute("UPDATE cameras SET name = 'CAM-03 · Central Crossroad (Angle C)', description = 'VIRAT Scene 02 Angle C · Central Junction & Vehicle Turn' WHERE camera_id = 'CAM_03'")
cursor.execute("UPDATE cameras SET name = 'CAM-04 · West Logistics Bay (Angle D)', description = 'VIRAT Scene 02 Angle D · Logistics Loading & Perimeter' WHERE camera_id = 'CAM_04'")

conn.commit()
print("Successfully updated database records with clean Unicode dot characters.")

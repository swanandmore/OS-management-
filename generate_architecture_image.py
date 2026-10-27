"""
Generate high-resolution architecture diagram image for the OS Dashboard project report.
"""
from PIL import Image, ImageDraw, ImageFont
import os

IMG_PATH = r"C:\Users\swana\.gemini\antigravity\scratch\os-dashboard\system_architecture_diagram.png"

# Setup Canvas: 2400 x 1800 (high DPI)
width, height = 2400, 1850
img = Image.new("RGB", (width, height), "#ffffff")
draw = ImageDraw.Draw(img)

# Try to load Windows standard fonts
try:
    font_bold_title = ImageFont.truetype("arialbd.ttf", 46)
    font_bold_layer = ImageFont.truetype("arialbd.ttf", 36)
    font_sub_layer  = ImageFont.truetype("ariali.ttf", 26)
    font_bold_sec   = ImageFont.truetype("arialbd.ttf", 28)
    font_body       = ImageFont.truetype("arial.ttf", 26)
    font_arrow      = ImageFont.truetype("arialbd.ttf", 24)
except Exception:
    font_bold_title = ImageFont.load_default()
    font_bold_layer = ImageFont.load_default()
    font_sub_layer  = ImageFont.load_default()
    font_bold_sec   = ImageFont.load_default()
    font_body       = ImageFont.load_default()
    font_arrow      = ImageFont.load_default()

# Colors
DARK_BLUE = "#0f172a"
BLUE_BG   = "#f0f7ff"
BLUE_BDR  = "#2563eb"

PURPLE_BG  = "#fbf5ff"
PURPLE_BDR = "#9333ea"

TEAL_BG   = "#f0fdfa"
TEAL_BDR  = "#0d9488"

CARD_BG   = "#ffffff"
GRAY_TEXT = "#475569"
LINE_COLOR = "#94a3b8"

# 1. Main Title
title_text = "SYSTEM ARCHITECTURE: OS RESOURCE MANAGEMENT & ALGORITHM SIMULATOR"
draw.text((width // 2, 60), title_text, fill=DARK_BLUE, font=font_bold_title, anchor="mm")

# Helper to draw rounded rectangle with border
def draw_card(box, fill, outline, width=3, radius=18):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

# ==================== LAYER 1: PRESENTATION LAYER ====================
top1, h1 = 120, 360
box1 = (120, top1, width - 120, top1 + h1)
draw_card(box1, BLUE_BG, BLUE_BDR, width=4)

# Header banner
draw.text((width // 2, top1 + 45), "PRESENTATION & USER INTERACTION LAYER", fill=BLUE_BDR, font=font_bold_layer, anchor="mm")
draw.text((width // 2, top1 + 80), "[Standalone Desktop Window (PyWebView)]   /   [Modern Web Browser (Chrome, Edge, Firefox)]", fill=GRAY_TEXT, font=font_sub_layer, anchor="mm")
draw.line([(160, top1 + 105), (width - 160, top1 + 105)], fill="#cbd5e1", width=2)

# Sub-cards inside Layer 1 (4 columns)
c_w = (width - 240 - 90) // 4
for i, (title, items) in enumerate([
    ("Dual HTML5 Canvases", ["60 FPS Waveform plots", "Real-Time CPU Usage %", "Network RX / TX Rates"]),
    ("Process Manager", ["Searchable Process Grid", "Sort by CPU / RAM MB", "SIGTERM Process Kill"]),
    ("Embedded Web Terminal", ["In-Browser PowerShell CLI", "Persistent Path (cwd)", "Arrow-Key Cmd History"]),
    ("AI Diagnostics", ["0-100% Health Index", "Active Anomaly Feeds", "On-Demand Deep Scanner"])
]):
    bx = 120 + 20 + i * (c_w + 20)
    card_box = (bx, top1 + 125, bx + c_w, top1 + h1 - 25)
    draw_card(card_box, CARD_BG, "#bfdbfe", width=2, radius=12)
    draw.text((bx + c_w // 2, top1 + 155), title, fill=DARK_BLUE, font=font_bold_sec, anchor="mm")
    draw.line([(bx + 20, top1 + 175), (bx + c_w - 20, top1 + 175)], fill="#e2e8f0", width=1)
    for j, it in enumerate(items):
        draw.text((bx + 25, top1 + 205 + j * 35), f"• {it}", fill=GRAY_TEXT, font=font_body)

# ==================== INTER-LAYER ARROWS 1 <-> 2 ====================
mid1 = top1 + h1
arrow_h = 100
a_y1 = mid1 + 15
a_y2 = a_y1 + arrow_h - 30

# Left Arrow: Requests
draw.line([(700, a_y1), (700, a_y2)], fill="#2563eb", width=5)
draw.polygon([(690, a_y2 - 5), (710, a_y2 - 5), (700, a_y2 + 15)], fill="#2563eb") # Down arrow
draw.text((680, (a_y1 + a_y2) // 2), "HTTP REST (JSON) / Subprocess Dispatch", fill="#2563eb", font=font_arrow, anchor="rm")

# Right Arrow: WebSocket Stream
draw.line([(1700, a_y2 + 10), (1700, a_y1 - 5)], fill="#16a34a", width=5)
draw.polygon([(1690, a_y1 + 5), (1710, a_y1 + 5), (1700, a_y1 - 15)], fill="#16a34a") # Up arrow
draw.text((1720, (a_y1 + a_y2) // 2), "WebSocket Telemetry Streams (0.35s Broadcast)", fill="#16a34a", font=font_arrow, anchor="lm")

# ==================== LAYER 2: CONTROLLER LAYER ====================
top2 = mid1 + arrow_h
h2 = 400
box2 = (120, top2, width - 120, top2 + h2)
draw_card(box2, PURPLE_BG, PURPLE_BDR, width=4)

draw.text((width // 2, top2 + 45), "APPLICATION CONTROLLER LAYER (FASTAPI + UVICORN ASGI)", fill=PURPLE_BDR, font=font_bold_layer, anchor="mm")
draw.text((width // 2, top2 + 80), "High-Performance Asynchronous Python Event Loop with WebSocket & Subprocess Handlers", fill=GRAY_TEXT, font=font_sub_layer, anchor="mm")
draw.line([(160, top2 + 105), (width - 160, top2 + 105)], fill="#e9d5ff", width=2)

# Sub-cards inside Layer 2 (3 columns)
c2_w = (width - 240 - 80) // 3
for i, (title, items) in enumerate([
    ("WebSocket Telemetry Engine (/ws)", [
        "Non-blocking async broadcast loop",
        "Pushes JSON metric frames every 350ms",
        "Delta calculation over elapsed window",
        "Zero packet loss & frame degradation"
    ]),
    ("System Controllers (/api)", [
        "Process Manager & Kill Controller",
        "Terminal Command Subprocess Runner",
        "Stateful working directory (cwd) manager",
        "Process execution timeout sanitization"
    ]),
    ("Heuristic Anomaly & Diagnostics", [
        "Sliding-window rule analysis engine",
        "Health Score deduction calculation",
        "Automated root-cause remediation tags",
        "Time-series queries (/api/history)"
    ])
]):
    bx = 120 + 20 + i * (c2_w + 20)
    card_box = (bx, top2 + 125, bx + c2_w, top2 + h2 - 25)
    draw_card(card_box, CARD_BG, "#e9d5ff", width=2, radius=12)
    draw.text((bx + c2_w // 2, top2 + 155), title, fill=DARK_BLUE, font=font_bold_sec, anchor="mm")
    draw.line([(bx + 20, top2 + 175), (bx + c2_w - 20, top2 + 175)], fill="#f3e8ff", width=1)
    for j, it in enumerate(items):
        draw.text((bx + 25, top2 + 205 + j * 38), f"• {it}", fill=GRAY_TEXT, font=font_body)

# ==================== INTER-LAYER ARROWS 2 <-> 3 ====================
mid2 = top2 + h2
a2_y1 = mid2 + 15
a2_y2 = a2_y1 + arrow_h - 30

# Left Arrow: Subprocess / Probe requests
draw.line([(700, a2_y1), (700, a2_y2)], fill="#9333ea", width=5)
draw.polygon([(690, a2_y2 - 5), (710, a2_y2 - 5), (700, a2_y2 + 15)], fill="#9333ea")
draw.text((680, (a2_y1 + a2_y2) // 2), "Hardware Probes & Subprocess Calls", fill="#9333ea", font=font_arrow, anchor="rm")

# Right Arrow: Low-level data & SQL
draw.line([(1700, a2_y2 + 10), (1700, a2_y1 - 5)], fill="#0d9488", width=5)
draw.polygon([(1690, a2_y1 + 5), (1710, a2_y1 + 5), (1700, a2_y1 - 15)], fill="#0d9488")
draw.text((1720, (a2_y1 + a2_y2) // 2), "Raw Kernel Metrics & SQLite Records", fill="#0d9488", font=font_arrow, anchor="lm")

# ==================== LAYER 3: KERNEL & SIMULATION LAYER ====================
top3 = mid2 + arrow_h
h3 = 410
box3 = (120, top3, width - 120, top3 + h3)
draw_card(box3, TEAL_BG, TEAL_BDR, width=4)

draw.text((width // 2, top3 + 45), "KERNEL PROBING, ALGORITHM SIMULATION & PERSISTENCE LAYER", fill=TEAL_BDR, font=font_bold_layer, anchor="mm")
draw.text((width // 2, top3 + 80), "Native Hardware Inspection via psutil C-Extensions, Educational Algorithm Models, and Embedded SQLite", fill=GRAY_TEXT, font=font_sub_layer, anchor="mm")
draw.line([(160, top3 + 105), (width - 160, top3 + 105)], fill="#ccfbf1", width=2)

# Sub-cards inside Layer 3 (3 columns)
c3_w = (width - 240 - 80) // 3
for i, (title, items) in enumerate([
    ("psutil Kernel Hooks", [
        "Per-core & aggregate CPU loads",
        "Physical RAM & Paging Virtual Memory",
        "Storage Read/Write MB/s throughput",
        "Network Interface RX/TX packet counters",
        "Host process tree & PID metrics"
    ]),
    ("Algorithm Simulation Suite", [
        "CPU: FCFS, SJF (Preempt/Non), Priority, RR",
        "Memory: First Fit, Best Fit, Worst Fit",
        "Paging: FIFO, LRU, Optimal (Belady's)",
        "Disk Seek: FCFS, SSTF, SCAN, C-SCAN",
        "Deadlock Avoidance: Banker's Safety Matrix"
    ]),
    ("SQLite Persistence Engine", [
        "database.db with Write-Ahead Logging",
        "metric_history: 5s snapshots (24h roll)",
        "anomalies: Audit records of detected issues",
        "logs: System event & error logs",
        "users: Role-based access control table"
    ])
]):
    bx = 120 + 20 + i * (c3_w + 20)
    card_box = (bx, top3 + 125, bx + c3_w, top3 + h3 - 25)
    draw_card(card_box, CARD_BG, "#99f6e4", width=2, radius=12)
    draw.text((bx + c3_w // 2, top3 + 155), title, fill=DARK_BLUE, font=font_bold_sec, anchor="mm")
    draw.line([(bx + 20, top3 + 175), (bx + c3_w - 20, top3 + 175)], fill="#f0fdfa", width=1)
    for j, it in enumerate(items):
        draw.text((bx + 25, top3 + 205 + j * 36), f"• {it}", fill=GRAY_TEXT, font=font_body)

# Save
img.save(IMG_PATH, quality=95)
print(f"High-res architecture diagram generated at: {IMG_PATH}")

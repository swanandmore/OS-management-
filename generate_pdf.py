import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

PDF_PATH = os.path.join(os.path.dirname(__file__), "OS_Management_Dashboard_Project_Report.pdf")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        if self._pageNumber > 1:
            # Header
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(54, 750, "MONITOR BOARD | OS Management Dashboard Project Report")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

            # Footer
            self.line(54, 45, 558, 45)
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#94a3b8"))
            self.drawString(54, 32, "Confidential - For Team Presentation & Review")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(558, 32, page_text)
        self.restoreState()

def generate_pdf():
    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0f172a")     # Deep Slate
    SECONDARY = colors.HexColor("#0284c7")   # Bright Cyan/Blue
    ACCENT = colors.HexColor("#7c3aed")      # Purple
    DARK_CARD = colors.HexColor("#1e293b")   # Card Dark
    LIGHT_BG = colors.HexColor("#f8fafc")    # Light Table BG
    BORDER_COLOR = colors.HexColor("#e2e8f0")
    TEXT_MAIN = colors.HexColor("#1e293b")
    TEXT_MUTED = colors.HexColor("#64748b")
    GREEN_COLOR = colors.HexColor("#16a34a")

    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=PRIMARY,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=SECONDARY,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_MAIN,
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=BORDER_COLOR,
        borderWidth=0.5,
        borderPadding=6,
        spaceAfter=8
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e3a8a"),
        backColor=colors.HexColor("#eff6ff"),
        borderColor=colors.HexColor("#bfdbfe"),
        borderWidth=0.75,
        borderPadding=8,
        spaceAfter=8
    )

    story = []

    # =========================================================================
    # PAGE 1: COVER / TITLE SECTION
    # =========================================================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("PROJECT DOCUMENTATION & ARCHITECTURE REPORT", ParagraphStyle('Sub', fontName='Helvetica-Bold', fontSize=10, textColor=ACCENT, spaceAfter=4)))
    story.append(Paragraph("Monitor Board: Full-Stack Real-Time OS Management Dashboard", title_style))
    story.append(Paragraph("A modern, dark-themed system telemetry and administrative web application with sub-second WebSocket streaming.", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=SECONDARY, spaceAfter=14))

    meta_data = [
        [Paragraph("<b>Project:</b> OS Management Dashboard", body_style), Paragraph("<b>Target Environment:</b> Windows / Linux / macOS", body_style)],
        [Paragraph("<b>Author/Presenter:</b> Engineering Team", body_style), Paragraph("<b>Telemetry Frequency:</b> 0.35s (High-Frequency)", body_style)],
        [Paragraph("<b>Backend Stack:</b> Python, FastAPI, WebSockets, psutil", body_style), Paragraph("<b>Database:</b> SQLite3 (Zero-config embedded)", body_style)],
        [Paragraph("<b>Frontend Stack:</b> HTML5 Canvas, Vanilla JS, Dark CSS", body_style), Paragraph("<b>Repository:</b> GitHub /swanandmore/OS-management-", body_style)]
    ]
    t_meta = Table(meta_data, colWidths=[250, 254])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Executive Summary", h1_style))
    story.append(Paragraph(
        "Modern systems engineering requires real-time insight into hardware resource utilization, background processes, "
        "storage allocation, network interfaces, and security logs. <b>Monitor Board</b> is an integrated full-stack solution "
        "engineered to bridge kernel-level telemetry with a responsive, pixel-perfect web dashboard. "
        "Unlike conventional polling-based dashboards that suffer from latency and high HTTP overhead, Monitor Board establishes "
        "a persistent bi-directional WebSocket connection streaming live OS snapshots at <b>350ms (0.35s)</b> intervals, delivering "
        "ultra-smooth 60fps graph flow representation through quadratic bezier spline interpolation.",
        body_style
    ))

    story.append(Paragraph("Key Technical Milestones Accomplished", h2_style))
    story.append(Paragraph("• <b>Kernel-Direct Telemetry:</b> Leveraged Python's <code>psutil</code> library to extract CPU core frequencies, thread loads, RAM/swap memory buffers, disk read/write bandwidth, and network socket statistics.", bullet_style))
    story.append(Paragraph("• <b>High-Frequency Streaming (0.35s):</b> Engineered an asynchronous WebSocket broadcast pipeline ensuring immediate visual reactivity without overloading host CPU resources.", bullet_style))
    story.append(Paragraph("• <b>Full OS Management Suite:</b> Built 8 comprehensive modules including Process Management with kill signals, Network Adapter Inspector, Storage Volume Browser, SQLite RBAC User Accounts, and Audit Logs.", bullet_style))
    story.append(Paragraph("• <b>Smooth Canvas Splines:</b> Rendered continuous dynamic bezier curves on HTML5 Canvas to prevent jagged lines and accurately depict instantaneous network and CPU spikes.", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: SYSTEM ARCHITECTURE & DATA PIPELINE
    # =========================================================================
    story.append(Paragraph("System Architecture & Data Pipeline", h1_style))
    story.append(Paragraph(
        "The application follows a lightweight, high-performance architecture separating presentation, streaming protocol, "
        "and kernel metrics collection into distinct layers.",
        body_style
    ))

    arch_diagram = """
    +-----------------------------------------------------------------------------------+
    |                           CLIENT BROWSER (Chrome, Edge, Firefox)                  |
    |  +--------------------+  +----------------------+  +---------------------------+  |
    |  |  SVG Gauge Needles |  | HTML5 Canvas Splines |  | Interactive Admin Tables  |  |
    |  +--------------------+  +----------------------+  +---------------------------+  |
    |             ^                                                    ^                |
    |             | (WebSocket Stream: 0.35s)                          | (REST API)     |
    +-------------|----------------------------------------------------|----------------+
                  |                                                    |
    +-------------|----------------------------------------------------|----------------+
    |             v                                                    v                |
    |                                FASTAPI APPLICATION SERVER                         |
    |  +---------------------------+                 +-------------------------------+  |
    |  |  WebSocket Telemetry Loop |                 |  REST Endpoints (/api/*)      |  |
    |  |  - Async non-blocking     |                 |  - /api/metrics, /api/network |  |
    |  |  - 350ms interval sleep   |                 |  - /api/processes (kill/sort) |  |
    |  +---------------------------+                 +-------------------------------+  |
    |                 |                                                |                |
    |                 v                                                v                |
    |  +-------------------------------+             +-------------------------------+  |
    |  |   PSUTIL KERNEL ADAPTER       |             |   SQLITE3 EMBEDDED DATABASE   |  |
    |  |   - CPU Core Deltas           |             |   - User accounts & roles     |  |
    |  |   - RAM, Swap, Partitions     |             |   - System audit & event logs |  |
    |  |   - Network Socket Telemetry  |             |   - Config & alert thresholds |  |
    |  +-------------------------------+             +-------------------------------+  |
    |                 |                                                                 |
    +-----------------|-----------------------------------------------------------------+
                      v
    +-----------------------------------------------------------------------------------+
    |                 HOST OPERATING SYSTEM KERNEL (Windows / Linux / macOS)             |
    +-----------------------------------------------------------------------------------+
    """
    story.append(Paragraph(arch_diagram.replace(" ", "&nbsp;").replace("\n", "<br/>"), code_style))

    story.append(Paragraph("Data Flow Lifecycle", h2_style))
    story.append(Paragraph("<b>1. Continuous Sampling:</b> On connection, the server initializes CPU counter baselines. At each 0.35s tick, instantaneous delta times (<code>dt</code>) are calculated to convert raw byte counters into exact speeds (MB/s, KB/s).", bullet_style))
    story.append(Paragraph("<b>2. Serialization & Broadcast:</b> Metrics are structured into a lightweight JSON payload and transmitted over the persistent WebSocket pipe.", bullet_style))
    story.append(Paragraph("<b>3. Client Ingestion & Buffer Shifting:</b> The frontend receives the snapshot, shifts internal 45-point historical buffers, updates gauge stroke offsets, and executes an instant canvas repaint.", bullet_style))
    story.append(Paragraph("<b>4. Fault-Tolerant Fallback:</b> If WebSocket communication is interrupted, the client seamlessly degrades to 350ms HTTP REST polling while attempting automatic reconnection in the background.", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Tech Stack Decision Matrix", h2_style))

    stack_table_data = [
        [Paragraph("<b>Component</b>", body_bold), Paragraph("<b>Selected Technology</b>", body_bold), Paragraph("<b>Engineering Rationale</b>", body_bold)],
        [Paragraph("Backend Framework", body_style), Paragraph("Python FastAPI", body_style), Paragraph("Asynchronous ASGI speed, built-in WebSocket support, automatic OpenAPI/Swagger specs.", body_style)],
        [Paragraph("Metrics Engine", body_style), Paragraph("psutil (Python)", body_style), Paragraph("Cross-platform C-bindings directly interfacing with OS kernel counters; zero external daemon dependencies.", body_style)],
        [Paragraph("Real-Time Comms", body_style), Paragraph("Native WebSockets", body_style), Paragraph("Eliminates HTTP header overhead per packet; minimal CPU impact at 3 updates/second.", body_style)],
        [Paragraph("Database", body_style), Paragraph("SQLite3", body_style), Paragraph("Serverless, zero-configuration embedded database ideal for containerized or single-node OS management.", body_style)],
        [Paragraph("Frontend UI", body_style), Paragraph("Vanilla JS + HTML5 Canvas", body_style), Paragraph("Eliminates heavy runtime bundler overhead, instant boot time in browser, full 60fps canvas rendering.", body_style)]
    ]
    t_stack = Table(stack_table_data, colWidths=[110, 130, 264])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG])
    ]))
    story.append(t_stack)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: MODULE-BY-MODULE WALKTHROUGH (PART 1)
    # =========================================================================
    story.append(Paragraph("Core Modules Walkthrough (Part 1)", h1_style))
    story.append(Paragraph("Here is a detailed breakdown of each management module implemented in the application:", body_style))

    story.append(Paragraph("1. Monitor Board (Real-Time Live Dashboard)", h2_style))
    story.append(Paragraph(
        "The primary dashboard replicates a professional NOC / SOC dark-themed interface with 9 synchronized visual widgets:",
        body_style
    ))
    story.append(Paragraph("• <b>CPU Usage Gauge:</b> Semi-circular SVG gauge arc displaying total load percentage, user vs. system vs. idle ratios, and individual progress bars for all physical and logical CPU cores with color-coded idle (green), user (purple), and system (cyan) states.", bullet_style))
    story.append(Paragraph("• <b>CPU History Spline Chart:</b> High-resolution HTML5 Canvas charting System and User load over a rolling 3-minute window. Uses quadratic bezier curves to maintain fluid motion without stair-stepping.", bullet_style))
    story.append(Paragraph("• <b>Disk Space Utilization:</b> Dual-segment progress bars showing used (pink) and free (green) gigabytes, mount points (e.g. <code>/</code>, <code>/home</code>, <code>C:\\</code>), and file system types (NTFS, ext4).", bullet_style))
    story.append(Paragraph("• <b>Network Interfaces Snapshot:</b> Quick-glance adapter cards displaying up/down state, current link rates, and lifetime cumulative data transfer totals.", bullet_style))
    story.append(Paragraph("• <b>Network Activity Flow:</b> Dual-gradient area chart rendering glowing yellow upload curves and cyan download curves mapped to dynamic kilobyte/megabyte transfer scales.", bullet_style))
    story.append(Paragraph("• <b>Disk I/O Telemetry:</b> Drive activity monitor displaying real-time read and write throughput in MB/s and KB/s with active IO indicators.", bullet_style))
    story.append(Paragraph("• <b>Memory Usage Gauge:</b> Dedicated physical RAM gauge displaying percentage utilized and an 'Expand Details' shortcut.", bullet_style))
    story.append(Paragraph("• <b>System Load Average:</b> Triple-column bar graph visualizing UNIX-equivalent 1m, 5m, and 15m load metrics against CPU core capacity.", bullet_style))
    story.append(Paragraph("• <b>System Alerts:</b> Active notification panel with badge indicators highlighting critical thresholds (e.g., high IOWait, memory exhaustion).", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("2. Process Management Module", h2_style))
    story.append(Paragraph(
        "An administrative interface allowing operators to inspect and control active tasks running on the operating system:",
        body_style
    ))
    story.append(Paragraph("• <b>Process Discovery:</b> Traverses the kernel process table via <code>psutil.process_iter()</code> to gather PID, binary name, owner/user, CPU utilization %, and RAM consumption %.", bullet_style))
    story.append(Paragraph("• <b>Sorting & Search Filtering:</b> Live text search allows instant filtering by process name. Results can be sorted descending by CPU or memory usage.", bullet_style))
    story.append(Paragraph("• <b>Interactive Termination (Kill Signal):</b> Operators can terminate rogue or memory-hogging processes via an <code>End Process</code> button, which dispatches a secure POST request to <code>/api/processes/{pid}/kill</code> and writes an audit log.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("3. Memory Management Module", h2_style))
    story.append(Paragraph(
        "Provides in-depth diagnostics into physical RAM and virtual paging files:",
        body_style
    ))
    story.append(Paragraph("• <b>RAM Breakdown:</b> Metrics include Total Physical Memory, Used RAM, Available/Free RAM, and percentage utilization.", bullet_style))
    story.append(Paragraph("• <b>Virtual Memory & Swap:</b> Displays allocated swap space and swap file consumption to identify thrashing before system lockups occur.", bullet_style))
    story.append(Paragraph("• <b>Visual Memory Strip:</b> Dual-color horizontal allocation bar depicting memory pressure in real time.", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: MODULE-BY-MODULE WALKTHROUGH (PART 2)
    # =========================================================================
    story.append(Paragraph("Core Modules Walkthrough (Part 2)", h1_style))

    story.append(Paragraph("4. Network Management Module (Deep Adapter Inspector)", h2_style))
    story.append(Paragraph(
        "A dedicated administrative panel inspecting all network interface cards (NICs), physical Ethernet, Wi-Fi adapters, and virtual switches:",
        body_style
    ))
    story.append(Paragraph("• <b>Summary KPI Cards:</b> Aggregates global download volume (RX), global upload volume (TX), and the count of active vs. total network adapters.", bullet_style))
    story.append(Paragraph("• <b>Adapter Configuration Table:</b> Details interface names, operational state (Up/Down with glowing status dot), assigned IPv4 address, subnet mask, IPv6 address, and hardware MAC address.", bullet_style))
    story.append(Paragraph("• <b>Performance & Error Diagnostics:</b> Tracks link speed (Mbps), MTU packet ceiling, total transmitted/received packets, and error/dropped packet counts to detect faulty cables or network collisions.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("5. File System Explorer", h2_style))
    story.append(Paragraph("• <b>Drive Mounting:</b> Enumerates all mounted hard drives, SSDs, external USB volumes, and network drives.", bullet_style))
    story.append(Paragraph("• <b>Capacity Gauging:</b> Reports total storage capacity, consumed gigabytes, and remaining free space.", bullet_style))
    story.append(Paragraph("• <b>Filesystem Types:</b> Detects NTFS, ext4, APFS, and FAT32 file system formats.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("6. User Account Management (RBAC)", h2_style))
    story.append(Paragraph("• <b>SQLite Backed:</b> Persists user accounts inside an embedded SQLite relational database (<code>database.db</code>).", bullet_style))
    story.append(Paragraph("• <b>Role-Based Access:</b> Supports three permission tiers: <i>Administrator</i> (full access), <i>Operator</i> (process and log management), and <i>Viewer</i> (read-only telemetry).", bullet_style))
    story.append(Paragraph("• <b>Full CRUD Operations:</b> Administrators can add users, assign credentials, modify status (Active/Disabled), and delete accounts through interactive modals.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("7. Operating System Audit Logs", h2_style))
    story.append(Paragraph("• <b>Structured Event Logging:</b> Records timestamped system events, threshold breaches, user modifications, and process terminations.", bullet_style))
    story.append(Paragraph("• <b>Severity Filtering:</b> Real-time dropdown filter to isolate <code>CRITICAL</code>, <code>WARNING</code>, and <code>INFO</code> log entries.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("8. System Settings & Customization", h2_style))
    story.append(Paragraph("• <b>Telemetry Polling Controls:</b> Operators can switch polling intervals between 1s (real-time), 2s (standard), and 5s (eco mode).", bullet_style))
    story.append(Paragraph("• <b>Alert Threshold Tuning:</b> Custom sliders to set CPU and Memory alert triggers (e.g. 85% CPU / 80% RAM).", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: TECHNICAL DEEP-DIVE & TELEMETRY ENGINE
    # =========================================================================
    story.append(Paragraph("Technical Deep-Dive: High-Frequency Telemetry", h1_style))
    story.append(Paragraph(
        "Achieving a smooth, real-time graph presentation without degrading system performance requires careful algorithmic design. "
        "Below are the primary engineering techniques implemented:",
        body_style
    ))

    story.append(Paragraph("1. Sub-Second Non-Blocking Polling Engine", h2_style))
    story.append(Paragraph(
        "Standard polling methods block execution or cause high CPU spikes when querying CPU percentages repeatedly. "
        "In <code>server.py</code>, we primed the <code>psutil</code> CPU counters at application startup. "
        "The asynchronous event loop runs a non-blocking coroutine yielding control via <code>await asyncio.sleep(0.35)</code>. "
        "Because the time delta is dynamically measured (<code>dt = max(curr_time - prev_time, 0.1)</code>), network byte deltas "
        "are converted into true instantaneous throughput rates with zero drift.",
        body_style
    ))

    story.append(Paragraph("2. Canvas Spline Interpolation Algorithm", h2_style))
    story.append(Paragraph(
        "Traditional line charts draw straight line segments between discrete data points, resulting in jagged zigzag graphs. "
        "Monitor Board implements quadratic bezier midpoint interpolation directly on the HTML5 Canvas context:",
        body_style
    ))

    code_math = """
    // Midpoint Spline Curve Interpolation
    for (let i = 0; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    """
    story.append(Paragraph(code_math.replace(" ", "&nbsp;").replace("\n", "<br/>"), code_style))
    story.append(Paragraph(
        "This algorithm calculates the midpoint between every pair of consecutive coordinates and uses quadratic control vectors "
        "to generate continuous, organic wave curves that glide seamlessly across the screen at 60 frames per second.",
        body_style
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph("3. REST API Specification Table", h2_style))

    api_table_data = [
        [Paragraph("<b>Endpoint</b>", body_bold), Paragraph("<b>Method</b>", body_bold), Paragraph("<b>Description</b>", body_bold), Paragraph("<b>Sample Payload / Return</b>", body_bold)],
        [Paragraph("<code>/api/metrics</code>", body_style), Paragraph("GET", body_style), Paragraph("Current system snapshot", body_style), Paragraph("<code>{ cpu, memory, disks, load, alerts }</code>", body_style)],
        [Paragraph("<code>/ws</code>", body_style), Paragraph("WS", body_style), Paragraph("0.35s streaming telemetry", body_style), Paragraph("Continuous JSON metric stream", body_style)],
        [Paragraph("<code>/api/network</code>", body_style), Paragraph("GET", body_style), Paragraph("All network adapters & IO", body_style), Paragraph("<code>{ interfaces: [...], total: {...} }</code>", body_style)],
        [Paragraph("<code>/api/processes</code>", body_style), Paragraph("GET", body_style), Paragraph("OS process table with search", body_style), Paragraph("<code>{ total, page, processes: [...] }</code>", body_style)],
        [Paragraph("<code>/api/processes/{pid}/kill</code>", body_style), Paragraph("POST", body_style), Paragraph("Terminate specific process", body_style), Paragraph("<code>{ status: 'success', pid: 1234 }</code>", body_style)],
        [Paragraph("<code>/api/users</code>", body_style), Paragraph("GET/POST", body_style), Paragraph("User account CRUD", body_style), Paragraph("<code>{ id, username, role, status }</code>", body_style)],
        [Paragraph("<code>/api/logs</code>", body_style), Paragraph("GET", body_style), Paragraph("Filtered system audit logs", body_style), Paragraph("<code>[ { id, level, message, ... } ]</code>", body_style)]
    ]
    t_api = Table(api_table_data, colWidths=[105, 50, 150, 199])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG])
    ]))
    story.append(t_api)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: PRESENTATION CHEAT SHEET & QUICK START
    # =========================================================================
    story.append(Paragraph("Presentation Cheat Sheet & How to Run", h1_style))
    story.append(Paragraph(
        "Use this section as your quick talking guide when presenting this project to your teammates or evaluating faculty:",
        body_style
    ))

    story.append(Paragraph("How to Start the Project in 30 Seconds", h2_style))
    story.append(Paragraph("<b>Option 1: Direct Python Launch (Recommended)</b>", body_bold))
    run_cmd = """
    cd C:\\Users\\swana\\.gemini\\antigravity\\scratch\\os-dashboard
    python server.py
    # Open Google Chrome at: http://localhost:8000
    """
    story.append(Paragraph(run_cmd.replace(" ", "&nbsp;").replace("\n", "<br/>"), code_style))

    story.append(Paragraph("<b>Option 2: Dockerized Multi-Container Launch</b>", body_bold))
    docker_cmd = """
    docker-compose up -d --build
    # Frontend available at port 5173, Backend at port 3001
    """
    story.append(Paragraph(docker_cmd.replace(" ", "&nbsp;").replace("\n", "<br/>"), code_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("Answers to Tough Questions Your Teammates Might Ask", h2_style))

    story.append(Paragraph(
        "<b>Q1: Why did we use WebSockets instead of normal HTTP polling?</b><br/>"
        "<i>Answer:</i> HTTP polling requires establishing a new TCP handshake and sending HTTP headers on every single request. "
        "At 3 requests per second (every 0.35s), that creates excessive network chatter and server CPU overhead. WebSockets keep a "
        "single persistent connection open, sending pure JSON payloads with near-zero overhead.",
        callout_style
    ))

    story.append(Paragraph(
        "<b>Q2: How is this getting actual OS stats instead of mock data?</b><br/>"
        "<i>Answer:</i> We use Python's <code>psutil</code> module, which binds directly to the operating system kernel's C APIs "
        "(Windows Performance Counters / Linux <code>/proc</code> filesystem). It reads the computer's actual live CPU registers, "
        "NIC packet buffers, and RAM pages.",
        callout_style
    ))

    story.append(Paragraph(
        "<b>Q3: How do the graphs look so smooth without any lag?</b><br/>"
        "<i>Answer:</i> Instead of heavy third-party charting libraries that re-render entire DOM nodes, we implemented an optimized "
        "HTML5 Canvas spline renderer with quadratic bezier curve interpolation and hardware-accelerated CSS transition smoothing.",
        callout_style
    ))

    story.append(Paragraph(
        "<b>Q4: Where is user and log data stored?</b><br/>"
        "<i>Answer:</i> Inside an embedded SQLite database (<code>database.db</code>). It requires zero server setup, runs entirely in-process, "
        "supports ACID transactions, and automatically seeds initial administrator accounts and system audit logs on startup.",
        callout_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {PDF_PATH}")

if __name__ == "__main__":
    generate_pdf()

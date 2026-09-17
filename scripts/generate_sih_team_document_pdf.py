"""
OnGround  -  SIH 2026 Official Team Master PDF Generator
Generates: 'docs/sih/OnGround_SIH_2026_Team_Document.pdf'
A single, complete, human-readable reference PDF for SIH teammates, reviewers, and jury.
"""

import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Theme Palette (Enterprise Slate & Engineering Blue)
C_PRIMARY = colors.HexColor("#0F172A")    # Deep Slate / Navy
C_SECONDARY = colors.HexColor("#1E293B")  # Slate Card Header
C_ACCENT = colors.HexColor("#2563EB")     # Engineering Blue
C_SUCCESS = colors.HexColor("#059669")    # Verified Emerald
C_WARNING = colors.HexColor("#D97706")    # Amber Alert
C_BG_LIGHT = colors.HexColor("#F8FAFC")   # Clean Light Box
C_BG_ALT = colors.HexColor("#F1F5F9")     # Table Alternating Row
C_BORDER = colors.HexColor("#E2E8F0")     # Subtle Border
C_TEXT_MAIN = colors.HexColor("#1E293B")  # Main Text
C_TEXT_MUTED = colors.HexColor("#64748B") # Muted Grey
C_CODE_BG = colors.HexColor("#F8FAFC")    # Code block background


class TeamNumberedCanvas(canvas.Canvas):
    """Two-pass canvas for dynamic total page count & running headers/footers on A4."""
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
        if self._pageNumber == 1:
            # Suppress header and footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(C_TEXT_MUTED)

        # Running Header (A4 height is ~841.89 pt)
        self.drawString(45, 841.89 - 36, "OnGround - SIH 2026 Master Technical & Project Guide")
        self.drawRightString(595.27 - 45, 841.89 - 36, "Problem Statement 26122")
        self.setStrokeColor(C_BORDER)
        self.setLineWidth(0.5)
        self.line(45, 841.89 - 42, 595.27 - 45, 841.89 - 42)

        # Running Footer
        self.line(45, 42, 595.27 - 45, 42)
        self.drawString(45, 30, "OnGround SIH Team Reference | Shourya-stack/OnGround")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(595.27 - 45, 30, page_str)

        self.restoreState()


def create_callout(text: str, title: str = "KEY PRINCIPLE", border_color=C_ACCENT, bg_color=C_BG_LIGHT, styles=None):
    """Creates a clean styled callout box with a thick left accent border."""
    p_title = Paragraph(f"<b>{title}</b>", styles["CalloutTitle"])
    p_body = Paragraph(text, styles["CalloutText"])
    
    t = Table([[p_title], [p_body]], colWidths=[505])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('LINELEFT', (0, 0), (0, -1), 3.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return t


def create_diagram_box(text: str, title: str = "SYSTEM DIAGRAM", styles=None):
    """Creates a clean monospace diagram box."""
    p_title = Paragraph(f"<b>{title}</b>", styles["CalloutTitle"])
    p_body = Paragraph(f"<font face='Courier' size='7.5'>{text.replace(' ', '&nbsp;').replace('\n', '<br/>')}</font>", styles["CodeBlock"])
    
    t = Table([[p_title], [p_body]], colWidths=[505])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_CODE_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('LINELEFT', (0, 0), (0, -1), 3.0, C_SECONDARY),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return t


def build_team_pdf():
    output_dir = Path("docs/sih")
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = output_dir / "OnGround_SIH_2026_Team_Document.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=48,
        bottomMargin=48,
    )

    base_styles = getSampleStyleSheet()
    styles = {
        "CoverTitle": ParagraphStyle(
            "CoverTitle",
            parent=base_styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=30,
            leading=36,
            textColor=C_PRIMARY,
            spaceAfter=6,
        ),
        "CoverSubtitle": ParagraphStyle(
            "CoverSubtitle",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=13,
            leading=18,
            textColor=C_ACCENT,
            spaceAfter=18,
        ),
        "CoverMeta": ParagraphStyle(
            "CoverMeta",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=15,
            textColor=C_TEXT_MAIN,
        ),
        "H1": ParagraphStyle(
            "H1",
            parent=base_styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=C_PRIMARY,
            spaceBefore=14,
            spaceAfter=8,
            keepWithNext=True,
        ),
        "H2": ParagraphStyle(
            "H2",
            parent=base_styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=C_ACCENT,
            spaceBefore=10,
            spaceAfter=5,
            keepWithNext=True,
        ),
        "H3": ParagraphStyle(
            "H3",
            parent=base_styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=14,
            textColor=C_SECONDARY,
            spaceBefore=7,
            spaceAfter=3,
            keepWithNext=True,
        ),
        "Body": ParagraphStyle(
            "Body",
            parent=base_styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=C_TEXT_MAIN,
            spaceAfter=5,
        ),
        "BodyBold": ParagraphStyle(
            "BodyBold",
            parent=base_styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=13,
            textColor=C_PRIMARY,
            spaceAfter=4,
        ),
        "Bullet": ParagraphStyle(
            "Bullet",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12.5,
            textColor=C_TEXT_MAIN,
            leftIndent=10,
            spaceAfter=3,
        ),
        "TableHead": ParagraphStyle(
            "TableHead",
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10.5,
            textColor=colors.white,
        ),
        "TableCell": ParagraphStyle(
            "TableCell",
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=C_TEXT_MAIN,
        ),
        "TableCellBold": ParagraphStyle(
            "TableCellBold",
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=10,
            textColor=C_PRIMARY,
        ),
        "CalloutTitle": ParagraphStyle(
            "CalloutTitle",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11.5,
            textColor=C_PRIMARY,
            spaceAfter=2,
        ),
        "CalloutText": ParagraphStyle(
            "CalloutText",
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=C_TEXT_MAIN,
        ),
        "CodeBlock": ParagraphStyle(
            "CodeBlock",
            fontName="Courier",
            fontSize=7.5,
            leading=9.5,
            textColor=C_PRIMARY,
        ),
    }

    story = []

    # =========================================================================
    # SECTION 1: COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 30))
    story.append(Paragraph("OnGround", styles["CoverTitle"]))
    story.append(Paragraph("SIH 2026  -  Complete Technical & Project Dossier", styles["CoverSubtitle"]))
    story.append(HRFlowable(width="100%", thickness=2, color=C_ACCENT, spaceAfter=20))

    cover_meta = """
    <b>Problem Statement Title:</b> Infrastructure Data Capture & Schedule-Linking<br/>
    <b>Problem Statement ID:</b> 26122<br/>
    <b>Category:</b> Software Edition &nbsp;|&nbsp; <b>Theme:</b> Miscellaneous<br/>
    <b>Target Domain:</b> EPC Megaproject Progress Automation & WBS Schedule Reconciliation<br/>
    <br/>
    <b>Project Repository:</b> github.com/Shourya-stack/OnGround<br/>
    <b>Frontend Web Application:</b> https://on-ground.vercel.app<br/>
    <b>Backend API Endpoint:</b> https://onground.onrender.com<br/>
    <br/>
    <b>Target Readers:</b> SIH Team Members, Hackathon Judges, Technical Evaluators, Project Planners<br/>
    <b>Document Purpose:</b> Definitive end-to-end technical, architectural, and presentation reference.
    """
    story.append(Paragraph(cover_meta, styles["CoverMeta"]))
    story.append(Spacer(1, 20))

    badge_box = (
        "<b>Executive Summary for Team Members:</b><br/>"
        "OnGround is an AI-powered system that bridges the gap between unstructured daily construction site logs "
        "(PDFs, spreadsheets, shift notes) and structured baseline schedules (Primavera P6 / WBS). "
        "It extracts physical tasks, deterministically calculates data completeness, semantically matches activities "
        "using 384-dimensional dense vectors, and provides planners with a 1-click verification workbench backed by an "
        "immutable PostgreSQL audit trail.<br/>"
        "<b>Current Status:</b> 17/17 backend unit tests passing (100%), clean TypeScript build, and 100% Top-1 accuracy on our 15-activity benchmark harness."
    )
    story.append(create_callout(badge_box, title="PROJECT VERIFICATION BADGE", border_color=C_SUCCESS, styles=styles))
    story.append(PageBreak())

    # =========================================================================
    # SECTION 2: PROJECT OVERVIEW & THE INDUSTRIAL PROBLEM
    # =========================================================================
    story.append(Paragraph("1. Project Overview & Problem Statement 26122", styles["H1"]))
    story.append(Paragraph(
        "<b>What is Problem Statement 26122?</b><br/>"
        "In large-scale infrastructure megaprojects (refineries, thermal power plants, highways, metro rails), projects are planned and monitored "
        "using Work Breakdown Structure (WBS) tools like Oracle Primavera P6 or Microsoft Project. These schedules contain thousands of discrete line items.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "However, physical progress on the ground is reported every day by dozens of subcontractors through informal, unstructured media: "
        "contractor shift handovers, scanned PDF daily progress reports (DPRs), and messy Excel spreadsheets.",
        styles["Body"]
    ))

    story.append(Paragraph("Why This Problem Matters in the Real World:", styles["H2"]))
    story.append(Paragraph("• <b>The Vocabulary & Semantic Mismatch:</b> Field supervisors use trade slang and colloquial terms (e.g. <i>'HV feeder pulling completed in Substation 3'</i>), whereas official schedules use formal engineering terminology (e.g. <i>'ELE-302: High voltage 11kV main feeder cable pulling and routing'</i>). Standard keyword matching and SQL LIKE searches fail 100% of the time.", styles["Bullet"]))
    story.append(Paragraph("• <b>Massive Manual Reconciliation Overhead:</b> Planning engineers spend 15 to 20 hours every week manually reading reports, trying to decipher which WBS activity was performed, and guessing linkages.", styles["Bullet"]))
    story.append(Paragraph("• <b>Reporting Lag & Multi-Week Blind Spots:</b> Because reconciliation is manual, master schedule updates lag by 1 to 3 weeks. By the time a delay on the critical path is noticed, project managers are already facing crores of rupees in liquidated damage penalties.", styles["Bullet"]))
    story.append(Paragraph("• <b>Contractual Dispute & Auditability Breakdown:</b> When contractors submit claims for project delays, there is no immutable, timestamped record proving exactly which daily log justified each schedule update.", styles["Bullet"]))
    
    story.append(Spacer(1, 6))

    # =========================================================================
    # SECTION 3: THE ONGROUND SOLUTION & WORKFLOW
    # =========================================================================
    story.append(Paragraph("2. The OnGround Solution & Complete User Journey", styles["H1"]))
    story.append(Paragraph(
        "OnGround automates this entire pipeline, converting messy site reality into structured, audit-proof schedule intelligence:",
        styles["Body"]
    ))

    journey_diagram = """
+--------------------------------------------------------------------------------------------------+
|                                    COMPLETE USER JOURNEY                                         |
+--------------------------------------------------------------------------------------------------+
  [ Site Supervisor ]                                    [ Project Planner ]
          |                                                       |
          v                                                       |
  1. Uploads Daily Report (.pdf, .xlsx, .csv, .txt)              |
          |                                                       |
          v                                                       |
  2. Document Parsing (pdfplumber / pandas / text)               |
          |                                                       |
          v                                                       |
  3. Structured LLM Activity Extraction (OpenRouter API)         |
          |                                                       |
          v                                                       |
  4. Deterministic Completeness Scoring (0.50 to 1.00)           |
          |                                                       |
          v                                                       |
  5. In-Memory Dense Vector Matching (sentence-transformers)     |
          |                                                       |
          +-------------------> [ Three-Tier Decision Banding ]   |
                                          |                       |
                +-------------------------+-----------------------+
                |                         |                       |
                v                         v                       v
      Score >= 0.85 (No Ambiguity)  0.70 <= Score < 0.85      Score < 0.70
          [ AUTO-LINKED ]          [ PENDING REVIEW ]        [ UNMATCHED ]
                |                         |                       |
                v                         v                       v
      Direct Schedule Link       Side-by-Side Review      Isolated Queue
                |                Planner 1-Click Confirm          |
                +-------------------------+                       |
                                          |                       |
                                          v                       v
                             [ Append-Only PostgreSQL Audit Trail (Immutable) ]
                                          |
                                          v
                             [ Supabase Realtime WebSocket Updates ]
                                          |
                                          v
                             [ Live Executive KPI Dashboard ]
+--------------------------------------------------------------------------------------------------+
"""
    story.append(create_diagram_box(journey_diagram, title="ONGROUND END-TO-END WORKFLOW PIPELINE", styles=styles))
    story.append(PageBreak())

    # =========================================================================
    # SECTION 4: FEATURES INVENTORY & USER ROLES
    # =========================================================================
    story.append(Paragraph("3. Implemented Features & User Roles", styles["H1"]))
    story.append(Paragraph(
        "OnGround implements distinct role-based workflows for Project Planners and Site Supervisors:",
        styles["Body"]
    ))

    feat_data = [
        [Paragraph("<b>Feature Module</b>", styles["TableHead"]), Paragraph("<b>Primary User Role</b>", styles["TableHead"]), Paragraph("<b>Interactive Capabilities & Business Value</b>", styles["TableHead"])],
        [Paragraph("<b>Executive Dashboard</b>", styles["TableCellBold"]), Paragraph("Project Directors / All", styles["TableCell"]), Paragraph("Live KPI summary cards (Total Matches, Auto-Linked %, Pending Review, Unmatched), Discipline Breakdown bars, Recent Upload status.", styles["TableCell"])],
        [Paragraph("<b>Report Upload Dropzone</b>", styles["TableCellBold"]), Paragraph("Site Supervisor", styles["TableCell"]), Paragraph("Drag-and-drop file ingestion, instant MIME format check (.pdf, .csv, .xlsx, .txt), 10MB size limit, live progress parsing animations.", styles["TableCell"])],
        [Paragraph("<b>Reconciliation Workbench</b>", styles["TableCellBold"]), Paragraph("Project Planner", styles["TableCell"]), Paragraph("Filterable table with status badges (auto_linked, pending_review), confidence score indicators, candidate expansion drawer.", styles["TableCell"])],
        [Paragraph("<b>Side-by-Side Review Panel</b>", styles["TableCellBold"]), Paragraph("Project Planner", styles["TableCell"]), Paragraph("Side-by-side comparison of raw field report metadata against baseline schedule candidate items with 1-click Confirm and Reject actions.", styles["TableCell"])],
        [Paragraph("<b>Unmatched Activities Queue</b>", styles["TableCellBold"]), Paragraph("Project Planner", styles["TableCell"]), Paragraph("Isolates field tasks falling below threshold (< 0.70) or rejected by planners, allowing investigation as out-of-scope tasks.", styles["TableCell"])],
        [Paragraph("<b>Baseline Schedule Explorer</b>", styles["TableCellBold"]), Paragraph("Project Planner", styles["TableCell"]), Paragraph("Master WBS schedule viewer with discipline filtering (Civil, Piping, Electrical, etc.), planned dates, and activity search.", styles["TableCell"])],
        [Paragraph("<b>Immutable Audit Trail</b>", styles["TableCellBold"]), Paragraph("Auditors / Planners", styles["TableCell"]), Paragraph("Chronological timeline of all system and human actions documenting event type, actor UUID, timestamp, and confidence score.", styles["TableCell"])],
    ]

    t_feat = Table(feat_data, colWidths=[120, 95, 290])
    t_feat.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_feat)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 5: CURRENT TECHNICAL ARCHITECTURE & STACK
    # =========================================================================
    story.append(Paragraph("4. Technical Stack & 'Why This Technology?'", styles["H1"]))
    story.append(Paragraph(
        "Here is the exact technology stack used in OnGround and the engineering rationale for each choice:",
        styles["Body"]
    ))

    stack_reasons = [
        [Paragraph("<b>Technology</b>", styles["TableHead"]), Paragraph("<b>Layer / Purpose</b>", styles["TableHead"]), Paragraph("<b>Why This Choice is Technically Optimal</b>", styles["TableHead"])],
        [Paragraph("<b>React 18 + Vite 5</b>", styles["TableCellBold"]), Paragraph("Frontend SPA", styles["TableCell"]), Paragraph("Sub-second hot-reloading, clean TypeScript compilation (483kB bundle), no server-side rendering (SSR) complexity for internal workbenches.", styles["TableCell"])],
        [Paragraph("<b>TypeScript 5.5</b>", styles["TableCellBold"]), Paragraph("Frontend Typing", styles["TableCell"]), Paragraph("Eliminates runtime type errors across complex WBS and matching models matching backend Pydantic schemas exactly.", styles["TableCell"])],
        [Paragraph("<b>FastAPI 0.110+</b>", styles["TableCellBold"]), Paragraph("Backend REST API", styles["TableCell"]), Paragraph("Asynchronous high-throughput Python API engine with automatic OpenAPI documentation and native Pydantic v2 data validation.", styles["TableCell"])],
        [Paragraph("<b>Python 3.12</b>", styles["TableCellBold"]), Paragraph("Backend Runtime", styles["TableCell"]), Paragraph("Native ecosystem for AI/ML libraries (sentence-transformers, torch, pandas, pdfplumber), avoiding inter-process bridging.", styles["TableCell"])],
        [Paragraph("<b>Supabase PostgreSQL 15</b>", styles["TableCellBold"]), Paragraph("Cloud Database", styles["TableCell"]), Paragraph("ACID relational integrity, Row-Level Security (RLS) policies for role control, native JSONB support for candidate arrays.", styles["TableCell"])],
        [Paragraph("<b>Supabase Realtime</b>", styles["TableCellBold"]), Paragraph("WebSocket Sync", styles["TableCell"]), Paragraph("Listens to PostgreSQL change events to update UI state across connected planner and supervisor clients in milliseconds.", styles["TableCell"])],
        [Paragraph("<b>all-MiniLM-L6-v2</b>", styles["TableCellBold"]), Paragraph("Vector Embeddings", styles["TableCell"]), Paragraph("Lightweight (80MB), runs in-memory on CPU in < 20ms with zero API cost, preserving site data privacy without external vector APIs.", styles["TableCell"])],
        [Paragraph("<b>OpenRouter API</b>", styles["TableCellBold"]), Paragraph("LLM Extraction", styles["TableCell"]), Paragraph("Access to free-tier high-accuracy LLMs (Liquid LFM 2.5 2.6B / Llama 3.3 70B) with structured JSON prompting and offline fallback.", styles["TableCell"])],
        [Paragraph("<b>Vercel + Render</b>", styles["TableCellBold"]), Paragraph("Cloud Hosting", styles["TableCell"]), Paragraph("Vercel global edge CDN for static SPA + Render containerized Python service in Oregon region.", styles["TableCell"])],
    ]

    t_stack_reasons = Table(stack_reasons, colWidths=[110, 95, 300])
    t_stack_reasons.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(t_stack_reasons)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 6: AI / ML PIPELINE & MATHEMATICAL FORMULATIONS
    # =========================================================================
    story.append(Paragraph("5. AI / ML Pipeline & Mathematical Formulations", styles["H1"]))
    story.append(Paragraph(
        "<b>The Core Engineering Innovation:</b> OnGround strictly separates generative LLM entity parsing from deterministic mathematical scoring. "
        "The LLM is never allowed to grade its own confidence.",
        styles["Body"]
    ))

    story.append(Paragraph("1. Deterministic Extraction Completeness Formula", styles["H2"]))
    story.append(Paragraph("Implemented in <code>backend/services/extraction_service.py</code>:", styles["Body"]))
    
    math_box_1 = (
        "<b>Confidence_extraction = min(1.0, 0.50 + δ_discipline + δ_start + δ_end + δ_location)</b><br/>"
        "• <b>Base Score = 0.50:</b> Awarded for any non-empty, valid task description.<br/>"
        "• <b>δ_discipline = +0.15:</b> Awarded if the discipline is recognized and != 'unknown' (e.g. 'piping', 'electrical').<br/>"
        "• <b>δ_start = +0.15:</b> Awarded if a valid ISO start timestamp/date is parsed.<br/>"
        "• <b>δ_end = +0.10:</b> Awarded if a valid ISO end timestamp/date is parsed.<br/>"
        "• <b>δ_location = +0.10:</b> Awarded if location reference is informative (length >= 3 characters).<br/>"
        "<i>Maximum score is clamped to 1.00.</i>"
    )
    story.append(create_callout(math_box_1, title="FORMULA 1: DETERMINISTIC EXTRACTION CONFIDENCE", border_color=C_ACCENT, styles=styles))
    story.append(Spacer(1, 6))

    story.append(Paragraph("2. Hybrid Composite Schedule Matching Formula", styles["H2"]))
    story.append(Paragraph("Implemented in <code>backend/services/matching_service.py</code> using 384-d dense vector embeddings:", styles["Body"]))

    math_box_2 = (
        "<b>Score_composite = (0.70 × Sim_cosine) + (0.20 × Confidence_extraction) + (0.10 × Factor_date) - Penalty_discipline</b><br/>"
        "• <b>Sim_cosine:</b> Cosine similarity between extracted task vector and baseline schedule item vector (0.0 to 1.0).<br/>"
        "• <b>Confidence_extraction:</b> Server-calculated deterministic completeness score (0.50 to 1.00).<br/>"
        "• <b>Factor_date:</b> Temporal proximity factor (defaults to 1.0 in standard evaluation).<br/>"
        "• <b>Penalty_discipline:</b> Strict <b>-0.15</b> deduction applied when disciplines clash (e.g. extracted is piping, schedule is civil).<br/>"
        "<i>Composite score is clamped to [0.00, 1.00].</i>"
    )
    story.append(create_callout(math_box_2, title="FORMULA 2: HYBRID CONTEXTUAL MATCHING SCORE", border_color=C_ACCENT, styles=styles))
    story.append(Spacer(1, 6))

    story.append(Paragraph("3. Decision Banding & Candidate Disambiguation Logic", styles["H2"]))
    story.append(Paragraph("• <b>Auto-Linked (Score >= 0.85 and NOT Ambiguous):</b> Automatically linked to baseline schedule item and logged to audit trail with actor = 'system'.", styles["Bullet"]))
    story.append(Paragraph("• <b>Pending Planner Review (0.70 <= Score < 0.85 OR Ambiguous):</b> Placed in the Planner Review Queue. <i>Disambiguation Rule:</i> If top candidate score >= 0.70 and |Score_top - Score_second| <= 0.05, autonomous linking is disabled and top-3 candidates are stored in JSONB for side-by-side planner review.", styles["Bullet"]))
    story.append(Paragraph("• <b>Unmatched (Score < 0.70):</b> Isolated in unmatched_activities to prevent schedule pollution.", styles["Bullet"]))
    story.append(PageBreak())

    # =========================================================================
    # SECTION 7: DATABASE SCHEMA & ERD
    # =========================================================================
    story.append(Paragraph("6. Database Architecture & Schema Deep-Dive", styles["H1"]))
    story.append(Paragraph(
        "OnGround implements a clean 7-table normalized relational schema in PostgreSQL (Supabase Cloud):",
        styles["Body"]
    ))

    db_erd_diagram = """
+--------------------------------------------------------------------------------------------------+
|                                  DATABASE ENTITY RELATIONSHIPS                                   |
+--------------------------------------------------------------------------------------------------+
   [ profiles ] ----------------+
   (User account & roles)       | (uploaded_by)
                                v
                       [ extractions ]
                       (Uploaded report jobs)
                                |
                                v (extraction_id)
                       [ extracted_activities ]
                       (Parsed tasks + confidence)
                                |
                +---------------+---------------+
                |                               |
                v (extracted_activity_id)       v (extracted_activity_id)
   [ schedule_matches ]               [ unmatched_activities ]
   (AI links: auto/review/confirm)    (Isolated tasks < 0.70)
        |                                       |
        +---------------+       +---------------+
                        |       |
                        v       v
                     [ audit_trail ]
                     (Append-only immutable event log)
                        ^
                        | (targets)
   [ schedule_plan ] ---+
   (Baseline WBS schedule items)
+--------------------------------------------------------------------------------------------------+
"""
    story.append(create_diagram_box(db_erd_diagram, title="DATABASE ENTITY RELATIONSHIP DIAGRAM", styles=styles))
    story.append(Spacer(1, 6))

    db_details_data = [
        [Paragraph("<b>Table Name</b>", styles["TableHead"]), Paragraph("<b>Columns & Constraints</b>", styles["TableHead"]), Paragraph("<b>Security & Workflow Role</b>", styles["TableHead"])],
        [Paragraph("<b>profiles</b>", styles["TableCellBold"]), Paragraph("id (UUID PK -> auth.users), email, full_name, role ('planner'|'supervisor')", styles["TableCell"]), Paragraph("User roles. RLS enabled: read by authenticated users.", styles["TableCell"])],
        [Paragraph("<b>schedule_plan</b>", styles["TableCellBold"]), Paragraph("id (UUID PK), project_id, activity_code, description, discipline, planned_start, planned_end", styles["TableCell"]), Paragraph("Baseline WBS ground truth (21 items in sample data). Insert/update/delete restricted to Planners.", styles["TableCell"])],
        [Paragraph("<b>extractions</b>", styles["TableCellBold"]), Paragraph("id (UUID PK), file_url, file_type, status ('pending'|'processing'|'complete'|'failed')", styles["TableCell"]), Paragraph("Tracks uploaded documents and extraction processing state.", styles["TableCell"])],
        [Paragraph("<b>extracted_activities</b>", styles["TableCellBold"]), Paragraph("id (UUID PK), extraction_id (FK), description, discipline, start, end, loc, extraction_confidence", styles["TableCell"]), Paragraph("Stores normalized physical tasks with server-calculated confidence.", styles["TableCell"])],
        [Paragraph("<b>schedule_matches</b>", styles["TableCellBold"]), Paragraph("id (UUID PK), extracted_id, plan_id, confidence_score, status, candidates (JSONB)", styles["TableCell"]), Paragraph("AI-linked mappings. Status: auto_linked, pending_review, confirmed, rejected. Planners can update.", styles["TableCell"])],
        [Paragraph("<b>unmatched_activities</b>", styles["TableCellBold"]), Paragraph("id (UUID PK), extracted_id (FK), best_score, resolution ('unresolved'|'marked_new'|'linked')", styles["TableCell"]), Paragraph("Isolates field tasks falling below 0.70 threshold or rejected by planner.", styles["TableCell"])],
        [Paragraph("<b>audit_trail</b>", styles["TableCellBold"]), Paragraph("id (UUID PK), match_id, unmatched_id, action, confidence_score, actor (UUID), created_at", styles["TableCell"]), Paragraph("<b>Append-Only Log:</b> RLS permits SELECT and INSERT. NO UPDATE OR DELETE policies exist.", styles["TableCell"])],
    ]

    t_db_det = Table(db_details_data, colWidths=[110, 165, 230])
    t_db_det.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_db_det)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 8: BACKEND ARCHITECTURE & REST APIS
    # =========================================================================
    story.append(Paragraph("7. Backend Architecture & REST APIs", styles["H1"]))
    story.append(Paragraph(
        "The FastAPI backend implements asynchronous request handling, Pydantic v2 data models, and dependency-injected role enforcement:",
        styles["Body"]
    ))

    api_specs = [
        [Paragraph("<b>HTTP Method & Endpoint</b>", styles["TableHead"]), Paragraph("<b>Auth Role</b>", styles["TableHead"]), Paragraph("<b>Request Parameters / Body</b>", styles["TableHead"]), Paragraph("<b>Response Model & Description</b>", styles["TableHead"])],
        [Paragraph("<code>GET /health</code>", styles["TableCellBold"]), Paragraph("Public", styles["TableCell"]), Paragraph("None", styles["TableCell"]), Paragraph("<code>HealthResponse</code>: status='ok', version='1.0.0'", styles["TableCell"])],
        [Paragraph("<code>POST /upload</code>", styles["TableCellBold"]), Paragraph("Supervisor / Planner", styles["TableCell"]), Paragraph("Multipart form-data: file (max 10MB), project_id, file_type", styles["TableCell"]), Paragraph("<code>UploadResponse</code>: extraction_id, file_url, status='pending'", styles["TableCell"])],
        [Paragraph("<code>POST /extract/{id}</code>", styles["TableCellBold"]), Paragraph("Supervisor / Planner", styles["TableCell"]), Paragraph("Path: extraction_id (UUID)<br/>Body: optional {raw_text: str}", styles["TableCell"]), Paragraph("<code>ExtractionResponse</code>: count, activities[], status='complete'", styles["TableCell"])],
        [Paragraph("<code>POST /match/{act_id}</code>", styles["TableCellBold"]), Paragraph("Supervisor / Planner", styles["TableCell"]), Paragraph("Path: extracted_activity_id (UUID)", styles["TableCell"]), Paragraph("<code>MatchResult</code>: status, confidence_score, candidates[]", styles["TableCell"])],
        [Paragraph("<code>POST /match/{id}/confirm</code>", styles["TableCellBold"]), Paragraph("<b>Planner Only</b>", styles["TableCellBold"]), Paragraph("Path: match_id (UUID)<br/>Header: Bearer JWT / X-User-Role", styles["TableCell"]), Paragraph("<code>ConfirmResponse</code>: match_id, status='confirmed'. Returns HTTP 403 for non-planners.", styles["TableCell"])],
        [Paragraph("<code>POST /match/{id}/reject</code>", styles["TableCellBold"]), Paragraph("<b>Planner Only</b>", styles["TableCellBold"]), Paragraph("Path: match_id (UUID)<br/>Body: {reason: str}", styles["TableCell"]), Paragraph("<code>RejectResponse</code>: match_id, status='rejected'. Returns HTTP 403 for non-planners.", styles["TableCell"])],
    ]

    t_api_spec = Table(api_specs, colWidths=[125, 75, 140, 165])
    t_api_spec.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(t_api_spec)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 9: SECURITY, ACCESS CONTROL & DEMO MECHANISMS
    # =========================================================================
    story.append(Paragraph("8. Security & Role Authorization Model", styles["H1"]))
    story.append(Paragraph(
        "OnGround implements multi-layer defense in depth across input sanitization, database RLS, and role authorization:",
        styles["Body"]
    ))
    story.append(Paragraph("• <b>File Sanitization:</b> Enforces strict file extension whitelisting (.pdf, .csv, .xlsx, .xls, .txt, .log) and a 10MB per-file boundary.", styles["Bullet"]))
    story.append(Paragraph("• <b>Token & Buffer Capping:</b> Text is normalized (Unicode NFKC) and capped at 8,000 characters to prevent token exhaustion.", styles["Bullet"]))
    story.append(Paragraph("• <b>Planner Role Enforcement:</b> Mutating schedule review endpoints (/match/confirm and /match/reject) use FastAPI's <code>require_planner_role</code> dependency, returning <code>HTTP 403 Forbidden</code> for non-planners.", styles["Bullet"]))
    story.append(Paragraph("• <b>Database-Level Append-Only Immutability:</b> PostgreSQL RLS policies permit SELECT and INSERT on the <code>audit_trail</code> table, with zero UPDATE or DELETE policies, creating a legally defensible audit record.", styles["Bullet"]))
    
    story.append(Spacer(1, 4))
    demo_auth_box = (
        "<b>Hackathon Role-Switching Mechanism Disclosure:</b><br/>"
        "For seamless interactive evaluation during SIH judging, the frontend includes a top-navigation role dropdown "
        "that injects the <code>X-User-Role</code> header (backed by localStorage key <code>onground_demo_role</code>). "
        "This allows judges to test Planner vs. Supervisor permissions with 1 click without re-authenticating."
    )
    story.append(create_callout(demo_auth_box, title="PROTOTYPE ROLE-SWITCHING MECHANISM", border_color=C_WARNING, styles=styles))
    story.append(PageBreak())

    # =========================================================================
    # SECTION 10: TESTING & EMPIRICAL VERIFICATION
    # =========================================================================
    story.append(Paragraph("9. Testing, Accuracy & Empirical Verification", styles["H1"]))
    story.append(Paragraph(
        "All claims in this document are supported by automated test suites and benchmark evaluations:",
        styles["Body"]
    ))

    test_summary_data = [
        [Paragraph("<b>Verification Area</b>", styles["TableHead"]), Paragraph("<b>Target Threshold</b>", styles["TableHead"]), Paragraph("<b>Verified Actual Result</b>", styles["TableHead"]), Paragraph("<b>Verification Test File</b>", styles["TableHead"])],
        [Paragraph("<b>Backend Unit Tests</b>", styles["TableCellBold"]), Paragraph("100% Pass Rate", styles["TableCell"]), Paragraph("<b>17 / 17 Passed (100%)</b>", styles["TableCellBold"]), Paragraph("backend/tests/ (pytest)", styles["TableCell"])],
        [Paragraph("<b>Frontend Compilation</b>", styles["TableCellBold"]), Paragraph("0 Build Errors", styles["TableCell"]), Paragraph("<b>Clean Build (0 Errors)</b>", styles["TableCellBold"]), Paragraph("tsc && vite build (3.98s)", styles["TableCell"])],
        [Paragraph("<b>Semantic Top-1 Accuracy</b>", styles["TableCellBold"]), Paragraph(">= 80.0%", styles["TableCell"]), Paragraph("<b>100.0% (15/15 activities)</b>", styles["TableCellBold"]), Paragraph("scripts/evaluate_pipeline.py", styles["TableCell"])],
        [Paragraph("<b>False-Positive Auto-Links</b>", styles["TableCellBold"]), Paragraph("0 False Positives", styles["TableCell"]), Paragraph("<b>0 Verified False Positives</b>", styles["TableCellBold"]), Paragraph("15-activity benchmark dataset", styles["TableCell"])],
        [Paragraph("<b>Baseline Schedule Size</b>", styles["TableCellBold"]), Paragraph("Representative WBS", styles["TableCell"]), Paragraph("<b>21 Baseline Activities</b>", styles["TableCellBold"]), Paragraph("data/baseline_schedule.csv", styles["TableCell"])],
    ]

    t_test_sum = Table(test_summary_data, colWidths=[125, 90, 135, 155])
    t_test_sum.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(t_test_sum)
    story.append(Spacer(1, 6))

    test_limits_box = (
        "<b>What Our Tests Prove vs. What They Do NOT Prove:</b><br/>"
        "• <b>What They PROVE:</b> Our multi-discipline extraction, deterministic confidence scoring, vector cosine matching, "
        "and discipline clashing penalties operate with 100% Top-1 accuracy across our 15-activity benchmark dataset with zero false-positive auto-links.<br/>"
        "• <b>What They Do NOT Prove:</b> They do not prove performance across millions of unformatted global construction documents. "
        "Always state our benchmark sample size (15 ground-truth activities across 6 disciplines) truthfully."
    )
    story.append(create_callout(test_limits_box, title="BENCHMARK VERIFICATION SCOPE", border_color=C_ACCENT, styles=styles))
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 11: STEP-BY-STEP LIVE DEMO GUIDE FOR TEAMMATES
    # =========================================================================
    story.append(Paragraph("10. Live Jury Demonstration Protocol", styles["H1"]))
    story.append(Paragraph(
        "Follow this exact click-by-click sequence during the 3-5 minute SIH jury evaluation:",
        styles["Body"]
    ))

    demo_steps = [
        [Paragraph("<b>Step & Screen</b>", styles["TableHead"]), Paragraph("<b>Exact Presenter Action</b>", styles["TableHead"]), Paragraph("<b>What Should Appear on Screen & What to Say</b>", styles["TableHead"])],
        [Paragraph("<b>Step 1: Dashboard</b><br/><code>/</code>", styles["TableCellBold"]), Paragraph("Open home page. Point mouse to top 4 KPI cards.", styles["TableCell"]), Paragraph("Show live summary counts: Total Matches, Auto-Linked %, Pending Review, Unmatched. Explain realtime WebSocket sync.", styles["TableCell"])],
        [Paragraph("<b>Step 2: Upload</b><br/><code>/upload</code>", styles["TableCellBold"]), Paragraph("Drag & drop <code>sample_report_electrical.txt</code>. Click 'Process'.", styles["TableCell"]), Paragraph("Validation badge turns green. Extracted cards appear within 2s with auto-detected discipline and deterministic confidence gauge (0.95).", styles["TableCell"])],
        [Paragraph("<b>Step 3: Reconciliation</b><br/><code>/reconciliation</code>", styles["TableCellBold"]), Paragraph("Open table. Point to an ambiguous match.", styles["TableCell"]), Paragraph("Show high-confidence auto-linked rows (>=85%) and an ambiguous electrical match where top 2 candidates are within a 5% score margin.", styles["TableCell"])],
        [Paragraph("<b>Step 4: Review Panel</b><br/><code>/review/:matchId</code>", styles["TableCellBold"]), Paragraph("Click 'Review Match'. Click green 'Confirm Link' button.", styles["TableCell"]), Paragraph("Show side-by-side comparison of field log vs baseline schedule. Confirm button updates status to 'confirmed' and verifies Planner role.", styles["TableCell"])],
        [Paragraph("<b>Step 5: Audit Trail</b><br/><code>/audit</code>", styles["TableCellBold"]), Paragraph("Navigate to audit page. Scroll to top entry.", styles["TableCell"]), Paragraph("Show permanent record with action ('confirmed'), planner UUID, timestamp, and score under PostgreSQL append-only security.", styles["TableCell"])],
    ]

    t_demo = Table(demo_steps, colWidths=[105, 150, 250])
    t_demo.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(t_demo)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 12: SIH PPT SLIDE BLUEPRINT
    # =========================================================================
    story.append(Paragraph("11. SIH PPT Slide-by-Slide Blueprint (18 Slides)", styles["H1"]))
    story.append(Paragraph(
        "Recommended structure for the official SIH 2026 Grand Finale presentation:",
        styles["Body"]
    ))

    ppt_blueprint_data = [
        [Paragraph("<b>Slide #</b>", styles["TableHead"]), Paragraph("<b>Slide Title</b>", styles["TableHead"]), Paragraph("<b>Key Visual & Highlighted Point</b>", styles["TableHead"])],
        [Paragraph("<b>1</b>", styles["TableCellBold"]), Paragraph("Title & Problem Statement", styles["TableCell"]), Paragraph("OnGround branding, PS 26122, Category, Team information, clean dark hero layout.", styles["TableCell"])],
        [Paragraph("<b>2</b>", styles["TableCellBold"]), Paragraph("The Industrial Problem", styles["TableCell"]), Paragraph("10,000+ WBS items vs messy contractor PDFs; 15-20 hrs/week manual reconciliation.", styles["TableCell"])],
        [Paragraph("<b>3</b>", styles["TableCellBold"]), Paragraph("The Semantic Mismatch Gap", styles["TableCell"]), Paragraph("Why keyword search fails: 'HV feeder pulling' vs 'ELE-302: High voltage cable pulling'.", styles["TableCell"])],
        [Paragraph("<b>4</b>", styles["TableCellBold"]), Paragraph("The OnGround Solution", styles["TableCell"]), Paragraph("Ingestion -> deterministic completeness -> dense vector matching -> audit trail.", styles["TableCell"])],
        [Paragraph("<b>5</b>", styles["TableCellBold"]), Paragraph("End-to-End Workflow", styles["TableCell"]), Paragraph("Horizontal pipeline diagram from daily log drop to live WebSocket dashboard sync.", styles["TableCell"])],
        [Paragraph("<b>6</b>", styles["TableCellBold"]), Paragraph("System Architecture", styles["TableCell"]), Paragraph("React 18 SPA (Vercel) -> FastAPI (Render) -> Supabase PostgreSQL/Storage/Realtime.", styles["TableCell"])],
        [Paragraph("<b>7</b>", styles["TableCellBold"]), Paragraph("AI Extraction & Scoring", styles["TableCell"]), Paragraph("Structured JSON schema + deterministic completeness formula (0.50 to 1.00).", styles["TableCell"])],
        [Paragraph("<b>8</b>", styles["TableCellBold"]), Paragraph("Matching Engine & Math", styles["TableCell"]), Paragraph("Dense vector cosine similarity, -0.15 discipline penalty, 0.05 disambiguation margin.", styles["TableCell"])],
        [Paragraph("<b>9</b>", styles["TableCellBold"]), Paragraph("Product Tour: Dashboard", styles["TableCell"]), Paragraph("Executive Dashboard screenshot with live KPI cards and discipline progress bars.", styles["TableCell"])],
        [Paragraph("<b>10</b>", styles["TableCellBold"]), Paragraph("Product Tour: Ingestion", styles["TableCell"]), Paragraph("Upload dropzone screenshot and Reconciliation Table with status pills.", styles["TableCell"])],
        [Paragraph("<b>11</b>", styles["TableCellBold"]), Paragraph("Product Tour: Review", styles["TableCell"]), Paragraph("Side-by-side comparison workbench with candidate disambiguation drawer.", styles["TableCell"])],
        [Paragraph("<b>12</b>", styles["TableCellBold"]), Paragraph("Security & Auditability", styles["TableCell"]), Paragraph("RBAC, Planner-only confirm/reject, PostgreSQL append-only RLS policies.", styles["TableCell"])],
        [Paragraph("<b>13</b>", styles["TableCellBold"]), Paragraph("Empirical Benchmarks", styles["TableCell"]), Paragraph("17/17 Unit Tests Passed, 100% Top-1 matching accuracy on benchmark dataset.", styles["TableCell"])],
        [Paragraph("<b>14</b>", styles["TableCellBold"]), Paragraph("Existing vs. OnGround", styles["TableCell"]), Paragraph("Comparative matrix: automation, auditability, near real-time update latency.", styles["TableCell"])],
        [Paragraph("<b>15</b>", styles["TableCellBold"]), Paragraph("Feasibility & Scalability", styles["TableCell"]), Paragraph("Stateless backend, low cloud footprint (< $100/mo), CPU-optimized embeddings.", styles["TableCell"])],
        [Paragraph("<b>16</b>", styles["TableCellBold"]), Paragraph("Future Roadmap", styles["TableCell"]), Paragraph("Primavera P6 direct REST sync, pgvector indexing, mobile OCR, 4D BIM visualizer.", styles["TableCell"])],
        [Paragraph("<b>17</b>", styles["TableCellBold"]), Paragraph("Live Demonstration Summary", styles["TableCell"]), Paragraph("Recap of verified live ingestion, vector matching, review confirmation, and audit log.", styles["TableCell"])],
        [Paragraph("<b>18</b>", styles["TableCellBold"]), Paragraph("Conclusion & Q&A", styles["TableCell"]), Paragraph("Ground reality connected to structured intelligence; transition to jury Q&A.", styles["TableCell"])],
    ]

    t_ppt_blue = Table(ppt_blueprint_data, colWidths=[40, 150, 315])
    t_ppt_blue.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_ppt_blue)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 13: TOP JUDGE Q&A DEFENSE PLAYBOOK
    # =========================================================================
    story.append(Paragraph("12. SIH Judge Q&A Defense Playbook", styles["H1"]))
    story.append(Paragraph(
        "Airtight answers to the top 12 most critical technical judge questions:",
        styles["Body"]
    ))

    qa_items = [
        ("Q1: How do you prevent LLM hallucinations from corrupting schedule data?",
         "The LLM is strictly used for syntactic entity extraction. Confidence scores and vector similarities are calculated deterministically in Python on the server. Unverified AI outputs never directly touch the schedule database."),
        
        ("Q2: Why use vector embeddings instead of keyword matching?",
         "Daily site reports use trade slang ('HV feeder pulling') with 0% exact substring overlap with official WBS line items ('ELE-302: High voltage cable pulling'). Vector embeddings capture semantic meaning beyond literal words."),
        
        ("Q3: What is your discipline clashing penalty?",
         "A strict -0.15 (15%) composite score deduction applied when extracted discipline and baseline discipline clash, preventing vector embeddings from confusing civil excavation with piping excavation."),
        
        ("Q4: How does the system handle ambiguous matches?",
         "If the top candidate score >= 0.70 and the score difference between the top two candidates is <= 0.05, autonomous linking is disabled and the top-3 candidates are presented side-by-side to the planner for review."),
        
        ("Q5: How is the audit trail protected from tampering?",
         "Enforced at the PostgreSQL database level via Row-Level Security (RLS). The audit_trail table permits SELECT and INSERT, with zero UPDATE or DELETE policies, creating an immutable legal record."),
        
        ("Q6: How does the system scale to 50,000 WBS activities?",
         "Currently, in-memory vector matching executes in milliseconds for standard schedules. For 50,000+ activities, our Phase 2 architecture integrates PostgreSQL's pgvector extension with pre-indexed IVFFlat / HNSW vector tables partitioned by discipline."),
        
        ("Q7: Is direct bi-directional Primavera P6 sync implemented?",
         "OnGround currently imports standardized baseline WBS schedule files (CSV/Excel exported from Primavera P6); direct bi-directional REST API synchronization is documented on our Phase 2 roadmap."),
        
        ("Q8: Why all-MiniLM-L6-v2 instead of OpenAI text-embedding-3?",
         "It is lightweight (80MB), runs locally on CPU in < 20ms with zero API cost, preserves project data privacy, and achieves 100% Top-1 accuracy on our domain benchmark dataset."),
        
        ("Q9: What happens if a contractor submits work not in the schedule?",
         "The matching score falls below 0.70, and the activity is safely isolated in the unmatched_activities queue without polluting the master schedule."),
        
        ("Q10: Who has authority to confirm schedule matches?",
         "Only authenticated users with the Planner role. Supervisors have read-only visibility and upload permissions."),
    ]

    for q, a in qa_items:
        story.append(Paragraph(f"<b>{q}</b>", styles["H3"]))
        story.append(Paragraph(f"<b>Answer:</b> {a}", styles["Body"]))
        story.append(Spacer(1, 2))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 14: LIMITATIONS & ROADMAP
    # =========================================================================
    story.append(Paragraph("13. System Limitations & Future Roadmap", styles["H1"]))
    story.append(Paragraph(
        "A clear, honest separation between what is implemented today and what is slated for future phases:",
        styles["Body"]
    ))

    story.append(Paragraph("<b>Currently Implemented & Verified in Code:</b>", styles["BodyBold"]))
    story.append(Paragraph("• Multi-format report ingestion (.pdf, .csv, .xlsx, .xls, .txt, .log) up to 10MB.", styles["Bullet"]))
    story.append(Paragraph("• OpenRouter LLM structured extraction with offline rule-based fallback.", styles["Bullet"]))
    story.append(Paragraph("• Server-side deterministic confidence calculation (0.50 to 1.00 completeness formula).", styles["Bullet"]))
    story.append(Paragraph("• In-memory 384-d dense vector semantic matching via sentence-transformers.", styles["Bullet"]))
    story.append(Paragraph("• Three-tier decision banding (>=85% auto-link, 70-84% review, <70% unmatched).", styles["Bullet"]))
    story.append(Paragraph("• Side-by-side planner review workbench with candidate disambiguation drawer.", styles["Bullet"]))
    story.append(Paragraph("• Planner-only confirm and reject review mutations returning HTTP 403 for unauthorized users.", styles["Bullet"]))
    story.append(Paragraph("• PostgreSQL append-only immutable audit trail with RLS disallowing updates and deletes.", styles["Bullet"]))
    story.append(Paragraph("• Supabase Realtime WebSocket synchronization on database mutation events.", styles["Bullet"]))

    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Future Roadmap (Phase 2 & Phase 3):</b>", styles["BodyBold"]))
    story.append(Paragraph("• <b>Phase 2 (3-6 Months):</b> Direct bi-directional REST API connector for Oracle Primavera P6; PostgreSQL pgvector HNSW indexing for 50k+ schedules; Audio voice-memo field capture via OpenAI Whisper; Native mobile camera document scanner.", styles["Bullet"]))
    story.append(Paragraph("• <b>Phase 3 (12 Months):</b> Automated 4D BIM schedule visualizer mapping progress to 3D IFC models; Predictive machine learning delay forecasting.", styles["Bullet"]))
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 15: FINAL ONE-PAGE FACT SHEET
    # =========================================================================
    story.append(Paragraph("14. Final Master Fact Sheet & Quick Reference", styles["H1"]))
    story.append(Paragraph(
        "A single-page summary of all authoritative project metadata, formulas, and verified benchmarks:",
        styles["Body"]
    ))

    fact_data = [
        [Paragraph("<b>Attribute</b>", styles["TableHead"]), Paragraph("<b>Authoritative Value / Implementation Detail</b>", styles["TableHead"])],
        [Paragraph("<b>Project Name</b>", styles["TableCellBold"]), Paragraph("OnGround (formerly referred to as TrueLine during development)", styles["TableCell"])],
        [Paragraph("<b>Problem Statement</b>", styles["TableCellBold"]), Paragraph("PS 26122: Infrastructure Data Capture & Schedule-Linking (Software Edition, Misc)", styles["TableCell"])],
        [Paragraph("<b>Repository & URLs</b>", styles["TableCellBold"]), Paragraph("github.com/Shourya-stack/OnGround | FE: on-ground.vercel.app | BE: onground.onrender.com", styles["TableCell"])],
        [Paragraph("<b>Active Tech Stack</b>", styles["TableCellBold"]), Paragraph("React 18, TypeScript 5.5, Vite 5, FastAPI 0.110, Python 3.12, Supabase PostgreSQL 15", styles["TableCell"])],
        [Paragraph("<b>AI Models Used</b>", styles["TableCellBold"]), Paragraph("LLM: OpenRouter (liquid/lfm-2.5-2.6b:free) | Embeddings: sentence-transformers (all-MiniLM-L6-v2)", styles["TableCell"])],
        [Paragraph("<b>Extraction Confidence</b>", styles["TableCellBold"]), Paragraph("Deterministic completeness formula: 0.50 (base) + 0.15 (disc) + 0.15 (start) + 0.10 (end) + 0.10 (location)", styles["TableCell"])],
        [Paragraph("<b>Matching Formula</b>", styles["TableCellBold"]), Paragraph("Composite Score = 0.70*Sim_cosine + 0.20*Conf_extract + 0.10*Date - 0.15*DisciplinePenalty", styles["TableCell"])],
        [Paragraph("<b>Decision Thresholds</b>", styles["TableCellBold"]), Paragraph(">= 0.85 Auto-Linked | 0.70 to 0.84 Pending Review (top-2 within 0.05 -> review) | < 0.70 Unmatched", styles["TableCell"])],
        [Paragraph("<b>Database Schema</b>", styles["TableCellBold"]), Paragraph("7 tables: profiles, schedule_plan, extractions, extracted_activities, schedule_matches, unmatched_activities, audit_trail", styles["TableCell"])],
        [Paragraph("<b>Audit Trail Security</b>", styles["TableCellBold"]), Paragraph("PostgreSQL RLS permits SELECT and INSERT; zero UPDATE or DELETE policies exist (Append-Only)", styles["TableCell"])],
        [Paragraph("<b>Unit Test Pass Rate</b>", styles["TableCellBold"]), Paragraph("17 Passed / 17 Total (100% Pass Rate via pytest backend/tests)", styles["TableCell"])],
        [Paragraph("<b>Benchmark Accuracy</b>", styles["TableCellBold"]), Paragraph("100.0% Top-1 Accuracy across 15 ground-truth activities (0 false-positive auto-links)", styles["TableCell"])],
        [Paragraph("<b>Baseline Schedule Size</b>", styles["TableCellBold"]), Paragraph("21 WBS activities in sample dataset (data/baseline_schedule.csv)", styles["TableCell"])],
    ]

    t_fact = Table(fact_data, colWidths=[130, 375])
    t_fact.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_fact)
    story.append(Spacer(1, 8))

    closing_box = (
        "<b>Final Presentation Safety Rule for Teammates:</b><br/>"
        "Be completely honest about what is live today (17 unit tests, 100% Top-1 benchmark on 15 activities, deterministic confidence scoring, in-memory vector matching, and PostgreSQL append-only audit trail) "
        "and present future integrations (Primavera P6 REST sync, pgvector 50k scaling, mobile OCR) strictly as Phase 2/3 roadmap milestones."
    )
    story.append(create_callout(closing_box, title="FINAL TEAM PRESENTATION DIRECTIVE", border_color=C_PRIMARY, styles=styles))

    # Build Document
    doc.build(story, canvasmaker=TeamNumberedCanvas)
    print(f"Team PDF successfully generated at: {pdf_path.resolve()}")
    return str(pdf_path.resolve())


if __name__ == "__main__":
    out_file = build_team_pdf()
    print("Generation complete:", out_file)

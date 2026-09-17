# OnGround — SIH 2026 Technical & Architectural Diagrams
**Project:** OnGround (Problem Statement ID: 26122)  
**Target Event:** Smart India Hackathon 2026 Grand Finale  
**Classification:** System Architecture, Data Flow, AI/ML & Database Diagrams  
**Factual Audit Status:** 100% Verified against Active Codebase (No Planned Features in Current Architecture)

---

## 1. Verified Active System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientTier ["CLIENT TIER (Vercel Global CDN)"]
        UI["React 18 + TypeScript 5 + Vite 5 SPA"]
        UI_Dash["Executive Dashboard"]
        UI_Upload["Upload Dropzone (PDF, CSV, XLSX, TXT)"]
        UI_Recon["Reconciliation Workbench"]
        UI_Review["Side-by-Side Review Panel"]
        UI_Audit["Immutable Audit Timeline"]
    end

    subgraph BackendTier ["BACKEND API TIER (FastAPI on Render Cloud)"]
        API["FastAPI 0.110+ (Python 3.12 / Uvicorn)"]
        Route_Upload["POST /upload (MIME & 10MB Validation)"]
        Route_Extract["POST /extract/{id} (Extraction Pipeline)"]
        Route_Match["POST /match/{act_id} (Vector Inference)"]
        Route_Review["POST /match/{id}/confirm & reject (Planner Role)"]
        
        Doc_Parser["Document Parsers (pdfplumber / pandas)"]
        LLM_Engine["OpenRouter API Client (LFM-2.5 / Nemotron / Fallback)"]
        Conf_Engine["Deterministic Completeness Scoring (0.50 - 1.00)"]
        Vector_Engine["sentence-transformers (all-MiniLM-L6-v2 In-Memory)"]
        Audit_Logger["Audit Service Logger"]
    end

    subgraph StorageDBTier ["DATABASE & STORAGE TIER (Supabase Cloud)"]
        Storage["Supabase Storage<br/>(Bucket: 'reports')"]
        Auth["Supabase Auth (JWT & Role Header)"]
        DB[(PostgreSQL 15 Database<br/>7 Relational Tables + RLS Policies)]
        Realtime["Supabase Realtime Engine<br/>(WebSocket Event Streaming)"]
    end

    subgraph ExternalServices ["EXTERNAL AI TIER"]
        OpenRouter["OpenRouter Gateway<br/>(liquid/lfm-2.5-2.6b:free)"]
    end

    %% Client Interactions
    UI -->|HTTPS REST API Requests| API
    UI <-->|WSS Realtime Subscriptions| Realtime
    
    %% Backend Internal Routing
    API --> Route_Upload & Route_Extract & Route_Match & Route_Review
    Route_Upload --> Storage
    Route_Extract --> Doc_Parser --> LLM_Engine --> OpenRouter
    Route_Extract --> Conf_Engine
    Route_Match --> Vector_Engine
    Route_Review --> Audit_Logger
    
    %% Database Persistences
    Route_Upload & Route_Extract & Route_Match & Route_Review --> DB
    Audit_Logger -->|Append-Only INSERT| DB
    DB -.->|postgres_changes Events| Realtime
```

---

## 2. End-to-End Data Flow Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Sup as Site Supervisor
    actor Plan as Project Planner
    participant FE as React 18 Frontend
    participant BE as FastAPI Backend
    participant LLM as OpenRouter LLM
    participant ST as Sentence-Transformers (In-Memory)
    participant DB as Supabase PostgreSQL
    participant RT as Supabase Realtime

    Sup->>FE: Drop Daily Progress Report (.pdf / .xlsx / .csv / .txt)
    FE->>BE: POST /upload (File Payload, max 10MB)
    BE->>BE: Validate MIME type & file extension
    BE->>DB: Store raw file in 'reports' bucket & INSERT into extractions (status='pending')
    BE-->>FE: Return UploadResponse (extraction_id)

    FE->>BE: POST /extract/{extraction_id}
    BE->>LLM: Send structured extraction prompt with report text
    LLM-->>BE: Return JSON array of discrete activities
    BE->>BE: Calculate deterministic confidence (0.50 - 1.00) based on completeness
    BE->>DB: INSERT into extracted_activities
    BE-->>FE: Return ExtractionResponse (count & models)

    FE->>BE: POST /match/{extracted_activity_id}
    BE->>ST: Encode description into 384-d dense vector
    BE->>BE: Compute cosine similarity against in-memory baseline WBS items
    BE->>BE: Apply discipline penalty (-0.15) & date factor
    
    alt Score >= 0.85 (and |S1 - S2| > 0.05)
        BE->>DB: INSERT schedule_matches (status='auto_linked')
        BE->>DB: INSERT audit_trail (action='auto_linked', actor=system)
    else 0.70 <= Score < 0.85 or Ambiguous (|S1 - S2| <= 0.05)
        BE->>DB: INSERT schedule_matches (status='pending_review', candidates=JSONB)
    else Score < 0.70
        BE->>DB: INSERT unmatched_activities (status='unresolved')
    end

    DB-->>RT: Broadcast postgres_changes event
    RT-->>FE: Live WebSocket UI state update

    Plan->>FE: Review pending match on Review Workbench
    Plan->>BE: POST /match/{id}/confirm (with Planner Auth Token)
    BE->>BE: Verify Planner role (HTTP 403 if unauthorized)
    BE->>DB: UPDATE schedule_matches (status='confirmed')
    BE->>DB: INSERT audit_trail (action='confirmed', actor=Planner_UUID)
    DB-->>RT: Broadcast update to Executive Dashboard
```

---

## 3. Verified AI Extraction & Deterministic Scoring Flow

```mermaid
flowchart TD
    Start([Raw Report Ingested]) --> FormatCheck{Format Type?}
    
    FormatCheck -->|PDF| PDFParse[pdfplumber Text Extraction]
    FormatCheck -->|CSV / XLSX| XLSParse[pandas DataFrame Normalization]
    FormatCheck -->|TXT / LOG| TXTParse[UTF-8 / Latin-1 Text Decoder]
    
    PDFParse & XLSParse & TXTParse --> Norm[Unicode NFKC Normalization & 8,000 Char Capping]
    
    Norm --> LLMCall[OpenRouter API: Structured Activity Extraction]
    LLMCall --> JSONParse[JSON Array Parser & Regex Cleaner]
    
    subgraph DeterministicScoring ["Deterministic Confidence Engine (Python Backend)"]
        BaseScore["Base Confidence = 0.50"]
        DiscCheck{"Discipline Valid & != 'unknown'?"}
        StartCheck{"Valid Start Timestamp?"}
        EndCheck{"Valid End Timestamp?"}
        LocCheck{"Location Ref >= 3 Chars?"}
        
        BaseScore --> DiscCheck
        DiscCheck -->|Yes: +0.15| StartCheck
        DiscCheck -->|No: +0.00| StartCheck
        StartCheck -->|Yes: +0.15| EndCheck
        StartCheck -->|No: +0.00| EndCheck
        EndCheck -->|Yes: +0.10| LocCheck
        EndCheck -->|No: +0.00| LocCheck
        LocCheck -->|Yes: +0.10| SumScore[Sum Clamped to Max 1.00]
        LocCheck -->|No: +0.00| SumScore
    end
    
    JSONParse --> DeterministicScoring
    SumScore --> OutputModel[Persist to extracted_activities Table]
```

---

## 4. Hybrid Semantic Matching & Decision Banding Algorithm

```mermaid
flowchart TD
    ExtractedAct[Extracted Field Activity] --> DenseVector[sentence-transformers all-MiniLM-L6-v2: 384-d Vector]
    BaselineActs[Active Baseline Schedule Items] --> BaseVectors[In-Memory 384-d WBS Vectors]
    
    DenseVector & BaseVectors --> CosSim[Compute Cosine Similarity Sim_cosine]
    
    subgraph ScoringFormula ["Hybrid Composite Scoring Formula"]
        WeightSim["0.70 * Sim_cosine"]
        WeightConf["0.20 * Extraction_Confidence"]
        WeightDate["0.10 * Date_Proximity_Factor"]
        DiscCheck{"Extracted Discipline != Plan Discipline?"}
        
        WeightSim & WeightConf & WeightDate --> SumWeights["Sum = 0.70*Sim + 0.20*Conf + 0.10*Date"]
        DiscCheck -->|Yes| Pen["Discipline Penalty: -0.15"]
        DiscCheck -->|No| NoPen["Penalty: 0.00"]
        
        SumWeights & Pen & NoPen --> FinalScore["Composite Score (0.00 to 1.00)"]
    end
    
    CosSim --> ScoringFormula
    
    FinalScore --> AmbCheck{"Top 2 Scores within 0.05 Margin?"}
    
    AmbCheck -->|Yes: Ambiguous| ForceReview["Force Status = PENDING_REVIEW<br/>Store Top-3 Candidates in JSONB"]
    AmbCheck -->|No: Unambiguous| BandCheck{Score Threshold}
    
    BandCheck -->|Score >= 0.85| AutoLink["Status: AUTO_LINKED<br/>Direct Schedule Link Established"]
    BandCheck -->|0.70 <= Score < 0.85| ReviewQueue["Status: PENDING_REVIEW<br/>Route to Planner Review Queue"]
    BandCheck -->|Score < 0.70| Unmatched["Status: UNMATCHED<br/>Isolate in Unmatched Queue"]
```

---

## 5. Database Entity Relationship (ER) Diagram (7 Implemented Tables)

```mermaid
erDiagram
    PROFILES ||--o{ EXTRACTIONS : "uploads"
    PROFILES ||--o{ SCHEDULE_MATCHES : "resolves"
    PROFILES ||--o{ AUDIT_TRAIL : "actors"
    
    EXTRACTIONS ||--|{ EXTRACTED_ACTIVITIES : "contains"
    
    EXTRACTED_ACTIVITIES ||--o| SCHEDULE_MATCHES : "linked_in"
    EXTRACTED_ACTIVITIES ||--o| UNMATCHED_ACTIVITIES : "isolated_in"
    
    SCHEDULE_PLAN ||--o{ SCHEDULE_MATCHES : "targets"
    
    SCHEDULE_MATCHES ||--o{ AUDIT_TRAIL : "audited_by"
    UNMATCHED_ACTIVITIES ||--o{ AUDIT_TRAIL : "audited_by"

    PROFILES {
        uuid id PK
        text email
        text full_name
        text role "planner | supervisor"
        timestamptz created_at
        timestamptz updated_at
    }

    SCHEDULE_PLAN {
        uuid id PK
        uuid project_id
        text activity_code
        text activity_description
        text discipline
        date planned_start
        date planned_end
        timestamptz created_at
    }

    EXTRACTIONS {
        uuid id PK
        uuid project_id
        text file_url
        text file_type
        text status "pending | processing | complete | failed"
        uuid uploaded_by FK
        timestamptz created_at
    }

    EXTRACTED_ACTIVITIES {
        uuid id PK
        uuid extraction_id FK
        text activity_description
        text discipline
        timestamptz start_time
        timestamptz end_time
        text location_reference
        float extraction_confidence
        timestamptz created_at
    }

    SCHEDULE_MATCHES {
        uuid id PK
        uuid extracted_activity_id FK
        uuid plan_activity_id FK
        float confidence_score
        text status "auto_linked | pending_review | confirmed | rejected"
        uuid resolved_by FK
        jsonb candidates
        timestamptz created_at
    }

    UNMATCHED_ACTIVITIES {
        uuid id PK
        uuid extracted_activity_id FK
        float best_score
        text resolution "unresolved | marked_new_activity | manually_linked"
        timestamptz created_at
    }

    AUDIT_TRAIL {
        uuid id PK
        uuid related_match_id FK
        uuid related_unmatched_id FK
        text action "extracted | auto_linked | flagged | confirmed | rejected | manually_linked"
        float confidence_score
        uuid actor FK
        timestamptz created_at
    }
```

---

## 6. Future Roadmap Architecture (Planned Phase 2 & 3 Ecosystem)

```mermaid
flowchart TD
    subgraph ImplementedCore ["CURRENT IMPLEMENTED CORE (OnGround v1.0)"]
        Core_App["FastAPI + React SPA + Supabase PostgreSQL"]
        Core_Matcher["In-Memory Vector Matcher + Deterministic Confidence"]
        Core_CSV["Standard Baseline Schedule CSV / Excel Ingestion"]
    end

    subgraph Phase2Roadmap ["PHASE 2 ROADMAP (3 - 6 Months)"]
        P2_P6["Direct Bi-Directional Oracle Primavera P6 REST API Connector"]
        P2_pgvector["PostgreSQL pgvector Extension with HNSW Indexing (50k+ scale)"]
        P2_Voice["Audio Voice Memo Field Capture via Whisper AI"]
        P2_Mobile["Mobile On-Device Camera Document Scanner"]
    end

    subgraph Phase3Roadmap ["PHASE 3 ROADMAP (12 Months)"]
        P3_BIM["Automated 4D BIM Schedule Progress Visualizer"]
        P3_Delay["Predictive Critical Path Delay Forecasting Engine"]
    end

    Core_App --> Phase2Roadmap --> Phase3Roadmap
```

---
*End of Technical & Architectural Diagrams*

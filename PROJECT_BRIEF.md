# PROJECT BRIEF — AI-Powered Executive Assistant for Photoprint

**Document type:** Business Requirements Document (BRD)
**Status:** Draft v0.1 — for stakeholder validation
**Date:** 2026-11-11
**Business owner / primary source:** Maksim Vasilyevich, CEO, Photoprint
**Intended readers:** Business stakeholders, product managers, software architects, developers, AI coding agents

> This document defines **what the business needs and why**. It deliberately contains no technology choices, architecture, integrations, API definitions, or numerical targets. Anything not established by the source material is marked `TBD` and tracked in [Section 15](#15-open-questions-and-unresolved-decisions).

---

## 0. How to Read This Document

### 0.1. Information Classification

| Label | Meaning |
|---|---|
| **Explicit** | Directly stated in the CEO's source description. |
| **Derived** | A necessary implication of an explicit expectation. Marked in the requirement's Status as `Proposed (Derived)`. |
| **Proposed Consideration** | A potentially useful idea requiring stakeholder validation. Never an approved requirement. |
| **Unknown / TBD** | Information not yet provided. Always linked to an Open Question (`OQ-xxx`). |

### 0.2. Identifier Conventions

| Prefix | Meaning |
|---|---|
| `FR-xxx` | Functional Requirement |
| `NFR-xxx` | Non-Functional Requirement |
| `SEC-xxx` | Security and Access-Control Requirement |
| `BUS-xxx` | Business Rule |
| `ASM-xxx` | Assumption (unvalidated) |
| `OQ-xxx` | Open Question |
| `P1`–`P6` | Business Problems One to Six |
| `PR1`–`PR8` | Core Product Principles |

### 0.3. Priority and Status Conventions

- **Priority** is assigned only where the source supports it:
  - **Critical** — the source states the item is mandatory, fundamental, or an absolute prohibition ("must never", "mandatory", "fundamental").
  - **High** — the source calls the item particularly important or urgent.
  - **Medium / Low** — not used; the source gives no basis.
  - **TBD** — priority cannot be established from the source.
- **Status**: `Confirmed` (explicit in source), `Proposed` (derived or suggested, needs validation), or `TBD`.
- Where an acceptance criterion depends on an unresolved business decision, it contains `TBD` and cites the relevant `OQ`.

---

## 1. Executive Summary

**Business context.** Photoprint operates a large-scale manufacturing facility with complex industrial equipment, warehouses, and many departments (manufacturing, logistics, sales, human resources, and others). The CEO, Maksim Vasilyevich, manages a very large number of interconnected processes and faces information overload, administrative burden, operational issues, and decisions that depend on information scattered across departments and systems.

**Problem.** Six problems have been identified:

1. **P1** — Meeting outcomes and accountability are lost after weekly management meetings.
2. **P2** — The CEO lacks context (previous agreements, overdue tasks, open issues) before meetings and calls.
3. **P3** — Time is lost searching internal documentation, and unsupported AI answers cannot be trusted.
4. **P4** — Uncontrolled AI autonomy could cause incorrect or harmful actions.
5. **P5** — Confidential business information could be exposed through an AI assistant.
6. **P6** — There is no immediate, low-effort operational visibility, especially on the manufacturing floor.

**Product vision.** A unified AI-powered executive assistant — a "digital executive secretary" — acting as a central intelligence layer that connects meetings, employees, internal documentation, tasks, and operational management systems. It is an intelligent executor and advisor, **not** an autonomous decision-maker.

**Primary business objectives.**

- Reduce administrative workload and prevent information loss.
- Improve managerial accountability.
- Accelerate access to reliable, source-backed company knowledge.
- Provide immediate visibility into critical business operations.
- Preserve human control and confidentiality at all times.

**Intended users and stakeholders.** The CEO is the confirmed primary stakeholder. Other roles (department heads, IT director, manufacturing managers, sales, HR, B2B clients) are mentioned in the source; their relationship to the product (user, participant, data subject, or none) is largely `TBD`. See [Section 5](#5-stakeholders-and-user-roles).

**Core statement of purpose.** *"I want to spend less time collecting, remembering, organizing, and verifying information — and more time making important business decisions."*

---

## 2. Business Context

### 2.1. Operational Environment

- Photoprint manages a large-scale manufacturing facility with complex industrial equipment.
- It operates warehouses and numerous departments, from manufacturing and logistics to sales and human resources.
- It maintains a strict organizational hierarchy with different levels of access to confidential information.
- It holds large volumes of internal documentation: operational regulations, manufacturing procedures, equipment manuals, technical instructions, process documentation, internal policies, department-specific guidelines, and other corporate documents.

### 2.2. Organizational Complexity

- Business processes are interconnected across departments.
- Information needed for decisions is scattered across departments and systems.
- Weekly meetings with department heads and senior managers produce discussions, problems, improvement proposals, and decisions.
- The CEO constantly moves between meetings with the IT director, manufacturing managers, department heads, and major B2B clients.

### 2.3. CEO Responsibilities and Information Needs

The CEO:

- Manages an enormous number of interconnected business processes daily.
- Cannot physically manage every administrative task or recall every detail of previous conversations, commitments, and unresolved issues.
- Cannot manually search hundreds of messages, documents, meeting recordings, and task lists before each conversation.
- Cannot stop to study laptops, dashboards, spreadsheets, or interactive charts while on the manufacturing floor.
- Needs reliable, verifiable, concise information that supports decisions and does not introduce new risks.

### 2.4. Management Challenges

| Challenge | Linked problem |
|---|---|
| Information loss after meetings; no shared understanding of agreements | P1 |
| Forgotten details leading to ineffective meetings | P2 |
| Slow, unreliable access to documented company knowledge | P3 |
| Risk of AI errors with financial and operational consequences | P4 |
| Risk of confidential information exposure | P5 |
| No immediate view of operational condition | P6 |

---

## 3. Business Problems and Pain Points

### 3.1. P1 — Losing Meeting Outcomes and Accountability

**Problem description.** Information from weekly management meetings effectively disappears once the meeting ends.

**Current situation.**
- Weekly meetings with department heads and senior managers discuss operations, identify problems, propose improvements, and make decisions; some of the most valuable business ideas emerge here.
- Audio recordings accumulate, but nobody has time to relisten to hours of conversation.
- Written meeting minutes are often inaccurate because conventional transcription struggles to distinguish speakers, understand context, and correctly attribute statements.

**Business consequences.**
- Lack of accountability.
- Different managers leave the same meeting with different interpretations of what was agreed.
- Tasks are forgotten, responsibilities remain unclear, and deadlines are never established.
- Valuable ideas are lost.

**Existing difficulties.** Inaccurate minutes; no speaker attribution; unreviewed recordings; no deadlines or owners.

**Desired outcome.** Immediately after a meeting, a concise, structured, factual report exists stating exactly who promised to do what, on what basis, and which responsibilities remain unresolved. Vague suggestions are never silently converted into confirmed tasks.

**Illustrative example (retained from source).** If someone says, *"We should probably improve the warehouse management process,"* but nobody specifies who is responsible or when it should happen, the system must explicitly flag the missing information.

**Related requirements.** FR-001 – FR-013; BUS-001 – BUS-003, BUS-014; NFR-001, NFR-010; SEC-011.

### 3.2. P2 — Lack of Context Before Meetings

**Problem description.** The CEO enters meetings and calls without reliable recall of prior discussions and open commitments.

**Current situation.**
- The schedule is extremely demanding, with constant movement between meetings with the IT director, manufacturing managers, department heads, and major B2B clients.
- The CEO cannot always remember details of previous conversations, outstanding commitments, or unresolved issues.

**Business consequences.** Meetings become ineffective because an important previously discussed detail is forgotten.

**Existing difficulties.** Manual searching through hundreds of messages, documents, meeting recordings, and task lists before each conversation is not feasible.

**Desired outcome.** Before an upcoming meeting, a concise briefing is automatically prepared and delivered at the right time — ideally before the CEO enters the meeting or answers a call — so context never has to be retrieved manually.

**Illustrative example (retained from source).** *"Your previous discussion with the Head of Manufacturing concerned equipment maintenance. Three assigned tasks remain overdue. The replacement parts procurement issue is still unresolved."*

**Related requirements.** FR-014 – FR-022, FR-046, FR-047; NFR-004, NFR-007; BUS-003; SEC-011.

### 3.3. P3 — Time Lost Searching Internal Documentation

**Problem description.** Finding specific answers in Photoprint's extensive internal documentation requires manual searching through multiple folders and files.

**Current situation.** Documentation spans regulations, manufacturing procedures, equipment manuals, technical instructions, process documentation, internal policies, department guidelines, and other corporate documents.

**Business consequences.**
- Time is lost searching.
- More critically, the CEO does not trust AI systems that generate convincing answers without evidence: an assistant might invent information, misunderstand a document, or reference an outdated version of an internal regulation.
- The CEO cannot make business decisions based on unsupported answers.

**Existing difficulties.** The main problem is **information reliability**, not search speed.

**Desired outcome.** Fast, reliable access to the internal knowledge base in which every factual answer is traceable to its source, current documents are distinguished from outdated or superseded ones, and missing information is stated openly.

**Illustrative example (retained from source).** *"Maksim Vasilyevich, according to the current Moderation Regulations, page 5, the procedure is as follows... This document was last updated on [date]."*

**Related requirements.** FR-023 – FR-029; BUS-004 – BUS-007; NFR-001 – NFR-003; SEC-004.

### 3.4. P4 — Concerns About AI Autonomy and Reliability

**Problem description.** AI systems lack human business experience, intuition, and understanding of the consequences of their actions. The CEO is concerned that the assistant might independently perform an incorrect or harmful operation.

**Current situation / feared scenarios (from source).**
- Sending an incorrect email to an important client.
- Creating an incorrect task in the company's management system.
- Changing business information without authorization.
- Confirming commercial terms that negatively affect profit margins.
- Communicating incorrect information to employees or external partners.

**Business consequences.** Serious financial and operational consequences.

**Desired outcome.** The assistant operates under a strict **Human-in-the-Loop** principle: it analyzes, drafts, and proposes, but never executes an external or consequential action without explicit approval from an authorized human.

**Related requirements.** FR-030 – FR-036; BUS-010, BUS-011, BUS-015; SEC-010.

### 3.5. P5 — Protection of Confidential Business Information

**Problem description.** Photoprint has a strict hierarchy and different access levels to confidential information. Employees and department heads must only access information relevant to their roles and authorized responsibilities. The CEO is concerned the AI could accidentally expose confidential information.

**Current situation.** Existing company access-control policies and departmental permissions exist (their details are `TBD`).

**Business consequences.** Unauthorized disclosure of confidential information across departments or hierarchy levels.

**Desired outcome.** The assistant understands the identity, role, and permissions of the authenticated employee and never discloses anything beyond them, in retrieval or in generated responses.

**Illustrative example (retained from source).** A Sales Department manager must never be able to retrieve confidential HR salary records or restricted financial reports simply by asking the AI assistant the right question.

**Key principle.** *The AI assistant must never have more effective access than the user it is serving.* Access control must be enforced by the application and its underlying data infrastructure, not merely through instructions given to the language model.

**Related requirements.** SEC-001 – SEC-012; FR-037, FR-038; BUS-008, BUS-009.

### 3.6. P6 — Lack of Immediate Operational Visibility

**Problem description.** On the manufacturing floor, surrounded by operating machinery and employees, the CEO cannot spend time opening a laptop or studying complex dashboards, spreadsheets, or interactive charts.

**Current situation.** Operational understanding currently requires interacting with complex management interfaces.

**Business consequences.** Delayed awareness of critical operational issues.

**Desired outcome.** The CEO asks a short question and receives a concise, accurate summary based on real company data — short, direct, actionable, prioritizing critical information, and clearly stating when everything is normal.

**Illustrative example (retained from source).** *"Maksim Vasilyevich, revenue is within the expected range, but there is a critical manufacturing alert: the defect rate on Printing Machine No. 2 has increased. The production manager is already investigating."*

**Related requirements.** FR-039 – FR-045; BUS-012, BUS-013; NFR-004, NFR-005, NFR-008, NFR-011.

---

## 4. Product Vision and Objectives

### 4.1. Product Vision

A unified AI-powered executive assistant for Photoprint that serves as a **central intelligence layer** connecting the company's meetings, employees, internal documentation, tasks, and operational management systems.

> **Vision vs. scope:** The vision describes the intended direction. Confirmed scope is defined only in [Section 11](#11-scope-and-boundaries). Capabilities in the vision that are not yet specified remain `TBD` until validated.

### 4.2. Role of the AI Executive Assistant

- A reliable **digital executive secretary** that takes over routine administrative work, organizes information, and supports the CEO where the CEO cannot physically manage everything.
- An **intelligent executor and advisor** — not an autonomous decision-maker.
- It may independently analyze, search, report, recommend, draft, and propose. It may not execute consequential actions without explicit human approval.

### 4.3. Relationship to Existing Business Processes

The assistant does not replace existing business processes or independently make decisions. It makes those processes easier to understand, coordinate, and control, and it must not bypass existing access-control policies.

### 4.4. Expected Business Value

- Reduced administrative workload.
- Prevention of information loss.
- Improved managerial accountability.
- Accelerated access to company knowledge.
- Immediate visibility into critical operations.
- More CEO time spent on important business decisions, with control maintained over a complex organization **without creating additional risks or administrative overhead**.

### 4.5. What the Product Is Intended to Improve

| Area | Improvement |
|---|---|
| Meetings | Accurate, attributable, actionable meeting records |
| Preparation | Automatic, timely context before meetings and calls |
| Knowledge | Fast, source-backed, version-aware answers |
| Control | Human approval for every consequential action |
| Confidentiality | Permission-bound access for every user |
| Operations | Immediate, concise, prioritized operational summaries |

### 4.6. Core Product Principles

| ID | Principle | Statement |
|---|---|---|
| PR1 | Accuracy over fluency | The assistant must never invent facts, commitments, documents, or operational data. |
| PR2 | Traceability | Important statements must be supported by identifiable sources whenever possible. |
| PR3 | Human control | No consequential external action may be performed without explicit authorization. |
| PR4 | Security by design | Every operation must respect the authenticated user's permissions. |
| PR5 | Context awareness | The assistant must understand relationships between people, meetings, tasks, documents, departments, and business processes. |
| PR6 | Operational simplicity | The interface must minimize the amount of information the CEO needs to process. |
| PR7 | Proactive assistance | The assistant should identify relevant information and prepare it at the appropriate time instead of waiting for every detail to be requested manually. |
| PR8 | Clear uncertainty | When information is incomplete, ambiguous, outdated, or unavailable, the assistant must communicate this explicitly. |

### 4.7. Overall Product Objective

Build a unified AI-powered executive assistant that connects meetings, employees, documentation, tasks, and operational systems to reduce administrative workload, prevent information loss, improve accountability, accelerate knowledge access, and provide immediate operational visibility — functioning as a reliable digital executive secretary that helps the CEO maintain control over a complex organization without creating additional risks or administrative overhead.

---

## 5. Stakeholders and User Roles

Only established information is recorded. All other fields are `TBD`. No organizational hierarchy or permission matrix is implied.

| Role | Established information | Relationship to product | Access level | Open items |
|---|---|---|---|---|
| **CEO (Maksim Vasilyevich)** | Manages the whole facility; holds weekly meetings; moves between meetings with many parties; needs concise operational visibility; is the stated approver of assistant actions ("my explicit approval"); is addressed by name in the examples. | Confirmed primary stakeholder and user. | TBD | OQ-017, OQ-029 |
| **IT Director** | Attends meetings with the CEO. | Meeting participant; use of the product TBD. | TBD | OQ-028 |
| **Manufacturing Managers / Head of Manufacturing** | Attend meetings; may hold assigned tasks (e.g., equipment maintenance, replacement parts procurement); "production manager" investigates alerts in the P6 example. | Meeting participants; task owners; likely responsible parties in alerts. | TBD | OQ-028, OQ-040 |
| **Department Heads / Senior Managers** | Attend weekly meetings; make commitments and receive tasks. | Meeting participants; commitment owners. | TBD | OQ-008, OQ-028 |
| **Sales Department Managers** | Mentioned as an example of a role that must not access HR salary records or restricted financial reports. | Potential system users (unconfirmed); example of a restricted user. | TBD | OQ-017, OQ-029 |
| **HR Personnel** | HR salary records are confidential. | Owners/subjects of confidential data; potential users TBD. | TBD | OQ-017 |
| **Other employees** | Different employees have access only to information relevant to their roles. | TBD | TBD | OQ-029 |
| **B2B Clients (major)** | The CEO meets major B2B clients; incorrect emails to important clients are a feared outcome. | External parties; recipients of approved communications; not stated as users. | N/A (not stated) | OQ-031 |
| **External partners** | Mentioned as possible recipients of incorrect information. | External parties. | N/A (not stated) | OQ-031 |
| **Authorized approver (generic)** | Human who reviews and approves actions. Identity beyond the CEO not established. | Approver role | TBD | OQ-020, OQ-021 |

---

## 6. Functional Requirements

All requirements below are business-level. They do not prescribe implementation. "Status: Confirmed" means explicit in the source; "Proposed (Derived)" means a necessary implication that needs stakeholder validation.

### 6.1. Meeting Intelligence (Source: P1)

| ID | Title | Category | Source | Description | Business Justification | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|---|---|
| FR-001 | Meeting content intake | Functional | P1 | The assistant must be able to attend meetings and process meeting audio recordings. Whether live attendance, recording processing, or both are supported is TBD. | Meeting outcomes are currently lost because recordings go unreviewed. | TBD | OQ-004, OQ-005 | For each meeting within the supported capture mode (TBD per OQ-004), the assistant produces a processed record of its content. | Confirmed |
| FR-002 | Speaker distinction | Functional | P1 | The assistant must distinguish individual speakers in a meeting. | Conventional transcription cannot distinguish speakers, causing inaccurate minutes. | TBD | FR-001, OQ-003, OQ-016 | Each statement in the report is attributed to an identified participant or explicitly marked as unattributed; required attribution accuracy is TBD (OQ-003). | Confirmed |
| FR-003 | Discussion understanding | Functional | P1 | The assistant must understand the discussion and extract meaningful business information, correctly attributing statements in context. | Accurate minutes require context, not just transcription. | TBD | FR-001, FR-002 | Extracted items (decisions, ideas, commitments, tasks, risks) correspond to what was actually said; accuracy threshold TBD (OQ-002, OQ-003). | Confirmed |
| FR-004 | Structured post-meeting report | Functional | P1 | Immediately after a meeting, the assistant must generate a concise, structured, factual report. | A shared factual record removes divergent interpretations of agreements. | High | FR-005 – FR-012, OQ-007 | A report is generated for each processed meeting and contains the elements required by FR-005 – FR-012; "immediately" time limit TBD (OQ-007). | Confirmed |
| FR-005 | Key points and decisions | Functional | P1 | The report must contain key discussion points and decisions. | Decisions are core meeting outcomes and are currently lost. | TBD | FR-004 | Every decision stated in the meeting appears in the report with its context; none is invented. | Confirmed |
| FR-006 | Ideas and initiatives | Functional | P1 | The report must contain important ideas and proposed initiatives. | Some of the most valuable business ideas emerge in meetings and are currently lost. | TBD | FR-004 | Ideas and initiatives raised in the meeting are listed and attributed to their proposer where identifiable. | Confirmed |
| FR-007 | Explicit commitments | Functional | P1 | The report must list explicit commitments made by individual participants. | Accountability requires knowing who promised what. | High | FR-002, FR-004 | Each explicit commitment lists the participant who made it. | Confirmed |
| FR-008 | Tasks, deadlines, expected outcomes | Functional | P1 | The report must list tasks assigned to specific people, with deadlines and expected outcomes where stated. | Tasks, responsibilities, and deadlines are currently forgotten or never established. | High | FR-004, FR-010 | Each task shows assignee, deadline, and expected outcome when stated in the meeting; missing elements are explicitly marked as missing, never filled in by the assistant. | Confirmed |
| FR-009 | Risks, concerns, unresolved issues | Functional | P1 | The report must list risks, concerns, and unresolved issues discussed. | Open issues must remain visible after the meeting. | TBD | FR-004 | Risks, concerns, and unresolved issues raised in the meeting appear in the report. | Confirmed |
| FR-010 | Incomplete-agreement flagging | Functional | P1 | The report must identify statements that indicate potential commitments but lack sufficient clarification, and explicitly flag the missing information (for example owner or deadline). | Described by the CEO as "particularly important"; prevents vague suggestions from being treated as agreements. | High | BUS-001, BUS-002, OQ-011 | In the example "We should probably improve the warehouse management process" with no owner or deadline, the item is flagged with the missing owner and missing deadline and is not listed as a confirmed task. Full flagging criteria TBD (OQ-011). | Confirmed |
| FR-011 | Commitment provenance | Functional | P1 | For each commitment, the report must show who promised it and what the commitment was based on. | The CEO needs to know "exactly who promised to do what, what they based their commitment on." | High | FR-007, OQ-012 | Each commitment shows the committing participant and the basis or context as stated in the meeting; representation of "basis" TBD (OQ-012). | Confirmed |
| FR-012 | Unresolved responsibilities | Functional | P1 | The report must show which responsibilities remain unresolved. | Unclear responsibilities are a root cause of lost accountability. | High | FR-010 | The report contains a distinct list of responsibilities with no confirmed owner. | Confirmed |
| FR-013 | Verifiability of report content to the meeting | Functional | P1 | Report statements should be verifiable against the original meeting content. | Different managers interpret meetings differently; verifiability allows disputes to be resolved. Not stated explicitly; derived from PR2 and P1. | TBD | FR-004, NFR-002, OQ-009 | Whether and how a report statement can be traced to its place in the meeting is TBD (OQ-009). | Proposed (Derived) |

### 6.2. Pre-Meeting Briefing (Source: P2)

| ID | Title | Category | Source | Description | Business Justification | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|---|---|
| FR-014 | Automatic pre-meeting briefing | Functional | P2 | Before an upcoming meeting, the assistant must automatically prepare a concise briefing on the participants and the meeting context. | The CEO cannot manually search messages, documents, recordings, and task lists before each conversation. | TBD | OQ-026, OQ-027 | For each upcoming meeting in the supported scope, a briefing is prepared without manual request; scope of meetings and calls TBD (OQ-027). | Confirmed |
| FR-015 | Participant identities and roles | Functional | P2 | The briefing must include participant identities and their roles within the company. | Context requires knowing who is attending and in what capacity. | TBD | FR-014, OQ-016 | Each participant is listed with name and role; for external participants, available information TBD (OQ-031). | Confirmed |
| FR-016 | Previous conversations and agreements | Functional | P2 | The briefing must include relevant previous conversations and agreements. | Forgotten details make meetings ineffective. | TBD | FR-014, FR-004 | Relevant prior discussions and agreements involving the participants are summarized. Definition of "relevant" TBD (OQ-010). | Confirmed |
| FR-017 | Outstanding tasks per participant | Functional | P2 | The briefing must include outstanding tasks assigned to each participant. | The CEO must know what each participant still owes. | TBD | FR-014, OQ-010, OQ-033 | Open tasks are listed per participant. | Confirmed |
| FR-018 | Overdue commitments and missed deadlines | Functional | P2 | The briefing must include overdue commitments and missed deadlines. | Overdue items are central to effective follow-up (example: three overdue maintenance tasks). | TBD | FR-017, OQ-010 | Overdue items are listed and clearly distinguished from on-time items. | Confirmed |
| FR-019 | Unresolved questions and pending decisions | Functional | P2 | The briefing must include unresolved questions and pending decisions. | Example: the replacement parts procurement issue is still unresolved. | TBD | FR-014 | Open questions and pending decisions relevant to the participants are listed. | Confirmed |
| FR-020 | Developments since previous meeting | Functional | P2 | The briefing must include relevant developments since the previous meeting. | The CEO needs to know what changed since they last met. | TBD | FR-014 | Relevant changes since the previous meeting with the same participants are summarized. Information sources TBD (OQ-027). | Confirmed |
| FR-021 | Concise briefing format | Functional | P2 | The briefing must be concise. | Source requires a "concise briefing"; avoids further information overload. | TBD | NFR-004 | The briefing contains only meeting-relevant information and is presentable at a glance; no numeric length limit is defined. | Confirmed |
| FR-022 | Timely briefing delivery | Functional | P2 | The assistant must provide the briefing at the right time, ideally before the CEO enters the meeting or answers a call. | A briefing delivered too late has no value. | TBD | FR-014, OQ-026 | The briefing is available before the meeting starts or the call is answered; exact timing and channel TBD (OQ-026). | Confirmed |

### 6.3. Internal Knowledge Access (Source: P3)

| ID | Title | Category | Source | Description | Business Justification | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|---|---|
| FR-023 | Internal knowledge-base answers | Functional | P3 | The assistant must provide fast, reliable access to the company's internal knowledge base by retrieving information from relevant internal documents when answering questions. | Manual search across multiple folders is slow. | TBD | OQ-013, SEC-004 | Answers to documentation questions are derived from relevant internal documents. Supported formats TBD (OQ-013). | Confirmed |
| FR-024 | Source identification | Functional | P3 | Each answer must identify its exact source, including the document title and relevant page number or section. | The CEO cannot act on unsupported answers. | Critical | FR-023, BUS-004 | Every factual answer shows document title and page or section; an answer without these is non-compliant. | Confirmed |
| FR-025 | Effective or revision date | Functional | P3 | Each answer must indicate the document's effective date or latest revision date. | Enables the CEO to judge currency of the information. | TBD | FR-024, OQ-014 | The date is shown with each source citation. | Confirmed |
| FR-026 | Current vs outdated documents | Functional | P3 | The assistant must distinguish current documents from outdated or superseded versions. | The assistant might reference an outdated internal regulation. | TBD | FR-025, BUS-005, OQ-014 | Outdated or superseded documents are never presented as current without explicit qualification. How currency is determined is TBD (OQ-014). | Confirmed |
| FR-027 | Not-found communication | Functional | P3 | The assistant must clearly state when reliable information cannot be found. | Prevents invented answers (PR1, PR8). | Critical | BUS-006 | If no reliable source exists, the assistant says so and does not offer an unsupported answer as fact. | Confirmed |
| FR-028 | Separation of documented facts from assumptions | Functional | P3 | The assistant must avoid presenting assumptions or generated information as established company policy. | The CEO needs to know what is policy and what is not. | Critical | BUS-004, BUS-006 | Any content not directly supported by a cited document is labeled as such or omitted. | Confirmed |
| FR-029 | Coverage of documentation categories | Functional | P3 | The knowledge base should cover: operational regulations, manufacturing procedures, equipment manuals, technical instructions, process documentation, internal policies, department-specific guidelines, and other corporate documents. | These are the document types in which the CEO's answers reside. | TBD | OQ-013 | Documents of each listed category can be used as sources, subject to access rights (SEC-004). Formats and repositories TBD. | Confirmed |

### 6.4. Controlled Actions — Human-in-the-Loop (Source: P4)

| ID | Title | Category | Source | Description | Business Justification | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|---|---|
| FR-030 | Independent analysis, search, reporting, recommendations | Functional | P4 | The assistant may independently analyze information, search documents, prepare reports, and generate recommendations. | Allows administrative offloading without risk of external effects. | TBD | BUS-015 | These activities can be performed without prior approval, provided they produce no external or consequential effect. | Confirmed |
| FR-031 | Draft emails and messages | Functional | P4 | The assistant may draft emails and messages. | Reduces administrative workload while keeping the human in control. | TBD | FR-034, FR-035, OQ-032 | A draft is created and not sent until approved. | Confirmed |
| FR-032 | Propose tasks and assignments | Functional | P4 | The assistant may prepare tasks and proposed assignments. | Supports accountability without creating tasks automatically. | TBD | FR-034, FR-035, OQ-033 | A proposed task exists as a proposal only; it is not created in any management system until approved. | Confirmed |
| FR-033 | Propose business-record changes | Functional | P4 | The assistant may suggest changes to business records. | Supports data upkeep without unauthorized modification. | TBD | FR-034, FR-035, OQ-034 | A suggested change is presented as a proposal; the record is unchanged until approved. | Confirmed |
| FR-034 | Review presentation | Functional | P4 | The assistant must present drafts and proposed operations for human review. | Approval cannot occur without the human seeing what will happen. | Critical | FR-035 | Before approval, the human can see the full content of the draft or proposed operation. | Confirmed |
| FR-035 | Approval gate | Functional | P4 | The assistant must wait for explicit approval from an authorized human before executing any external or consequential action: sending emails or messages, creating tasks, modifying business records, confirming commercial agreements, and other consequential external operations. | Prevents incorrect emails, tasks, record changes, and unfavorable commercial confirmations. | Critical | BUS-010, BUS-011, SEC-010, OQ-020 – OQ-022 | No such action takes effect without recorded explicit approval from an authorized human; absence of approval results in no action. | Confirmed |
| FR-036 | Execution matches approval | Functional | P4 | An approved action should be executed only as it was presented and approved. | An action altered after approval would defeat the approval. Not stated explicitly. | TBD | FR-035 | Content changed after approval requires new approval. Exact handling of edits TBD (OQ-021). | Proposed (Derived) |

### 6.5. Identity-Aware Behavior (Source: P5)

Detailed access-control requirements are in [Section 8](#8-security-and-access-control-requirements).

| ID | Title | Category | Source | Description | Business Justification | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|---|---|
| FR-037 | User-specific behavior | Functional | P5 | In every capability, the assistant must serve the identified, authenticated employee according to that person's role and permissions. | Confidentiality depends on knowing who is asking. | Critical | SEC-001 – SEC-003, OQ-016 – OQ-018 | The same request from users with different permissions yields responses limited to each user's access. | Confirmed |
| FR-038 | Handling of unauthorized requests | Functional | P5 | When a request would require information the user is not authorized to access, the assistant must not reveal that information. Whether it may acknowledge that restricted information exists is TBD. | Prevents leakage via direct and indirect questions (example: Sales manager asking for HR salary records). | Critical | SEC-007, OQ-041 | A Sales manager's request for HR salary records or restricted financial reports returns none of that information. Wording of the refusal TBD (OQ-041). | Confirmed |

### 6.6. Operational Visibility (Source: P6)

| ID | Title | Category | Source | Description | Business Justification | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|---|---|
| FR-039 | Operational data retrieval and analysis | Functional | P6 | The assistant must retrieve and analyze relevant information from the company's management systems and operational data sources. | Summaries must be based on real company data. | TBD | OQ-023, OQ-024, SEC-012 | Summaries reflect data from the designated sources (TBD, OQ-023) and are not fabricated. | Confirmed |
| FR-040 | Short-question operational summary | Functional | P6 | The CEO must be able to ask a short question and receive a concise, accurate summary of company condition. | The CEO cannot use dashboards or laptops on the manufacturing floor. | High | NFR-004, NFR-011, OQ-030 | A short question yields a concise, accurate answer. The interaction mode is TBD (OQ-030). | Confirmed |
| FR-041 | Coverage of operational areas | Functional | P6 | Summaries must cover, as relevant: current business performance; revenue and sales indicators; manufacturing performance; equipment status and critical alerts; production defects and quality issues; logistics and warehouse problems; outstanding operational incidents. | These are the areas the CEO needs visibility into. | TBD | FR-039, OQ-023 | Each listed area can be reported on when data is available; when not, the gap is stated explicitly (PR8). | Confirmed |
| FR-042 | Deviation reporting | Functional | P6 | Summaries must identify relevant deviations from expected performance. | Example: "revenue is within the expected range". | TBD | OQ-025 | Deviations are identified relative to expected performance; how "expected" is defined is TBD (OQ-025). | Confirmed |
| FR-043 | Critical-first prioritization | Functional | P6 | The assistant must prioritize critical information and avoid unnecessary detail. | Prevents information overload. | High | BUS-012, OQ-025 | Critical issues appear first; non-critical detail is omitted unless requested. "Critical" definition TBD (OQ-025). | Confirmed |
| FR-044 | Normal-state communication | Functional | P6 | If everything is operating normally, the assistant must communicate this clearly. | The absence of problems is itself useful information. | TBD | BUS-013 | When no issue requires attention, the response states that operations are normal. | Confirmed |
| FR-045 | Alert identification | Functional | P6 | If something requires immediate attention, the assistant must identify the problem, its location, and the responsible person whenever that information is available. | Example: defect rate on Printing Machine No. 2, production manager investigating. | High | OQ-025, OQ-040 | Each critical alert states problem, location, and responsible person; if the responsible person is unavailable in the data, this is stated. | Confirmed |

### 6.7. Cross-Cutting Capabilities (Source: Principles PR5, PR7)

| ID | Title | Category | Source | Description | Business Justification | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|---|---|
| FR-046 | Relationship awareness | Functional | PR5 | The assistant must understand relationships between people, meetings, tasks, documents, departments, and business processes. | Briefings, reports, and summaries rely on connecting information across these entities. | TBD | OQ-016, OQ-027 | Related items (e.g., a task, its owner, the meeting where it was assigned, the relevant document) can be correctly associated. Scope of entities TBD. | Confirmed |
| FR-047 | Proactive preparation | Functional | PR7 | The assistant should identify relevant information and prepare it at the appropriate time, without every detail being requested manually. | Reduces CEO effort; central to the briefing use case. | TBD | OQ-026 | Beyond pre-meeting briefings (FR-014), which other situations trigger proactive preparation is TBD (OQ-026). | Confirmed |

---

## 7. Non-Functional Requirements

No numerical service levels are defined. `TBD` values require stakeholder input.

### 7.1. Explicit Expectations

| ID | Title | Category | Source | Description | Business Justification | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|---|---|
| NFR-001 | Accuracy over fluency | Accuracy / Reliability | P1, P3, PR1 | The assistant must never invent facts, commitments, documents, or operational data, and must prioritize accuracy, verifiability, and relevance over producing an answer at all costs. | The CEO cannot make decisions on unsupported answers. | Critical | BUS-014, BUS-007 | No fabricated facts, commitments, documents, or data appear in outputs; evaluation method TBD (OQ-036). | Confirmed |
| NFR-002 | Source traceability | Traceability | P3, PR2 | Important statements, and every factual answer based on internal documentation, must be supported by identifiable sources whenever possible. | Enables verification. | Critical | FR-024, BUS-004 | Each documentation-based factual answer cites its source (FR-024). Traceability extent for other outputs (meeting reports, operational data) TBD. | Confirmed |
| NFR-003 | Clear uncertainty | Reliability | P1, P3, PR8 | When information is incomplete, ambiguous, outdated, or unavailable, the assistant must communicate this explicitly. | Avoids false confidence. | Critical | FR-010, FR-026, FR-027, BUS-016 | In every output, incomplete, ambiguous, outdated, or unavailable information is explicitly labeled. | Confirmed |
| NFR-004 | Conciseness | Usability | P2, P6, PR6 | Outputs (briefings, reports, operational answers) must be concise, direct, and actionable, minimizing the information the CEO must process. | Information overload is a core problem. | High | FR-004, FR-021, FR-040 | Outputs omit non-essential detail; no numeric length limit is defined. | Confirmed |
| NFR-005 | Operational simplicity | Usability | P6, PR6 | The CEO must be able to obtain information without interacting with complex management interfaces. | Dashboards, spreadsheets, and charts are impractical on the manufacturing floor. | High | FR-040, OQ-030 | A typical operational query can be satisfied by a short question and a short answer without navigating complex interfaces. | Confirmed |
| NFR-006 | Context awareness | Functional quality | PR5 | The assistant must maintain contextual understanding across people, meetings, tasks, documents, departments, and processes. | Needed for relevant briefings and accurate attribution. | TBD | FR-046 | Outputs reflect relevant context (e.g., prior commitments and task status of a participant). | Confirmed |
| NFR-007 | Timely information delivery | Responsiveness | P1, P2, P3, P6 | Reports must be available "immediately" after meetings, briefings before the meeting or call, documentation access must be "fast," and operational summaries "immediate." | Timing determines whether information is usable. | TBD | OQ-007, OQ-024, OQ-026 | Time limits are not defined and must not be invented; `TBD`. | Confirmed (thresholds TBD) |
| NFR-008 | Reliance on real, current data | Data currency | P6 | Operational summaries must be based on real company data. | Summaries must reflect actual condition. | TBD | FR-039, OQ-024 | Summaries identify the data they rely on; required update frequency TBD (OQ-024). | Confirmed (frequency TBD) |
| NFR-009 | Compatibility with existing processes | Compatibility | Overall objective | The product must not replace existing business processes or bypass existing access-control policies. | The product is meant to make existing processes easier to coordinate and control. | TBD | SEC-003 | Introduction of the product does not require replacing existing business processes. | Confirmed |
| NFR-010 | Attribution and extraction quality | Accuracy | P1 | Speaker attribution and the extraction of commitments, tasks, and decisions must be accurate enough to support accountability. | Inaccurate minutes are a stated problem. | TBD | FR-002, FR-003, OQ-002, OQ-003 | Required accuracy levels are TBD and must not be invented. | Confirmed (thresholds TBD) |
| NFR-011 | Usability in a physical production environment | Usability | P6 | The interaction must be practical for a user on the manufacturing floor, surrounded by machinery and employees, without a laptop. | Stated usage context. | TBD | FR-040, OQ-030 | Input and output modes suitable for this context are defined (TBD). | Confirmed (mode TBD) |

### 7.2. Proposed Considerations (Require Stakeholder Validation)

| ID | Title | Category | Source | Description | Business Justification | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|---|---|
| NFR-012 | Extensibility | Maintainability | Overall objective | The product might need to extend to additional departments, users, or data sources over time. | The vision describes a central layer connecting many functions; scope beyond the CEO is TBD. | TBD | OQ-028, OQ-029 | TBD | Proposed |
| NFR-013 | Auditability of approvals and access | Accountability | P4, P5 | A reviewable record of what was proposed, approved, rejected, and accessed might be useful. | Supports accountability for approvals and confidentiality. Not stated in source. | TBD | FR-035, SEC-002, OQ-039 | TBD | Proposed |

---

## 8. Security and Access Control Requirements

**Governing principle (Explicit):** *The AI assistant must never have more effective access than the user it is serving.* Access control must be enforced by the application and its underlying data infrastructure, not merely through instructions given to the language model.

No permission matrix is defined here. The information required to define one is listed in [Section 8.2](#82-information-required-to-define-a-permission-model).

### 8.1. Security Requirements

| ID | Title | Category | Source | Description | Business Justification | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-001 | User identity and authentication context | Security | P5 | The system must understand the identity of the currently authenticated employee. | All access decisions depend on identity. | Critical | OQ-016, OQ-018 | For every request, the requesting employee is known; unauthenticated requests receive no confidential information. Identity source TBD. | Confirmed |
| SEC-002 | Role-based access control | Security | P5 | The system must enforce role-based access control (RBAC) according to the employee's organizational role. | Employees must only access information relevant to their roles. | Critical | OQ-017 | Access results depend on the user's role; role definitions TBD. | Confirmed |
| SEC-003 | Respect existing departmental permissions | Security | P5 | The system must respect Photoprint's existing departmental permissions and must not bypass the company's existing access-control policies. | Preserves the existing hierarchy and policies. | Critical | OQ-017, OQ-019 | Any access allowed by the system is also allowed by existing policies; detailed policies TBD. | Confirmed |
| SEC-004 | Restrict confidential documents and records | Security | P5 | The system must restrict access to confidential documents and business records. | Protects confidential information. | Critical | OQ-019 | Users cannot retrieve documents or records outside their authorization. | Confirmed |
| SEC-005 | Prevent cross-departmental disclosure | Security | P5 | The system must prevent unauthorized cross-departmental information disclosure. | Example: Sales must not see HR salaries. | Critical | SEC-002, OQ-017 | A Sales manager cannot obtain HR salary records or restricted financial reports by any phrasing of a question. | Confirmed |
| SEC-006 | Permission-aware retrieval and generated responses | Security | P5 | Access restrictions must apply to both document retrieval and generated AI responses. | A generated answer can leak content even if retrieval is restricted. | Critical | SEC-007, SEC-009 | Generated responses contain no information derived from sources the user cannot access. | Confirmed |
| SEC-007 | No disclosure of unauthorized information | Security | P5 | The assistant must never reveal information the requesting employee is not authorized to access. | Absolute prohibition stated in source. | Critical | SEC-006 | Zero instances of unauthorized disclosure in testing; test coverage TBD (OQ-036). | Confirmed |
| SEC-008 | No excess effective access | Security | P5, PR4 | The assistant's effective access in any interaction must not exceed that of the user it is serving. | Core principle. | Critical | SEC-001 – SEC-003 | For every interaction, the assistant's accessible information is a subset of the user's. | Confirmed |
| SEC-009 | Enforcement beyond model instructions | Security | P5 | Access control must be enforced by the application and its underlying data infrastructure, not merely by instructions to the language model. | Instructions to a language model are not a reliable security boundary. | Critical | SEC-006, SEC-008 | A restricted item cannot be accessed even if the model is instructed or manipulated to do so; verification method TBD. | Confirmed |
| SEC-010 | Enforced approval gate | Security | P4 | The requirement for human approval of consequential actions must be enforced by the system, not left to the assistant's discretion. | A gate that depends only on assistant behavior is unreliable. Complements FR-035. | Critical | FR-035, BUS-010 | The assistant cannot execute a consequential action in the absence of approval. | Proposed (Derived) |
| SEC-011 | Access restrictions on meeting-derived content | Security | P1, P2, P5 | Meeting reports, briefings, and commitment records derive from meetings and may contain confidential information; their availability must respect user permissions. | Prevents leakage via meeting outputs. Not stated explicitly. | TBD | OQ-008, OQ-038 | Rules for who may access which meeting outputs are TBD. | Proposed (Derived) |
| SEC-012 | Access restrictions on operational data | Security | P6, P5 | Operational summaries must respect the user's access rights to the underlying management-system data. | The permission principle applies to every information retrieval operation. | Critical | FR-039, OQ-017, OQ-023 | A user receives only operational information they are authorized to see; detailed rules TBD. | Confirmed |

### 8.2. Information Required to Define a Permission Model

- Authoritative source of employee identities and organizational roles (OQ-016).
- Complete list of roles and the hierarchy among them (OQ-017).
- Existing access-control policies and their documentation, including their granularity (document, section, record, field) (OQ-019).
- How the user's identity is established in the business context (OQ-018).
- Whether the assistant may acknowledge the existence of restricted information (OQ-041).
- Handling of meetings with participants of differing access levels (OQ-038).
- Access rules for meeting recordings, reports, and briefings (OQ-008, OQ-038).

---

## 9. Human-in-the-Loop and Authorization Requirements

The assistant is an **intelligent executor and advisor, not an autonomous decision-maker**. Human authorization is mandatory for consequential actions.

### 9.1. Permitted Independent Activities (No Approval Required)

| Activity | Related requirement |
|---|---|
| Analyze information | FR-030 |
| Search documents / retrieve information | FR-023, FR-030 |
| Prepare reports | FR-004, FR-030 |
| Generate recommendations | FR-030 |
| Draft emails and messages (drafts only) | FR-031 |
| Prepare tasks and proposed assignments (proposals only) | FR-032 |
| Suggest changes to business records (suggestions only) | FR-033 |

All activities above must remain within the requesting user's access rights (SEC-008).

### 9.2. Actions Requiring Explicit Human Approval

| Action | Related requirement |
|---|---|
| Sending emails or messages | FR-035 |
| Creating tasks | FR-035 |
| Modifying business records | FR-035 |
| Confirming commercial agreements | FR-035 |
| Any other consequential external operation (full list TBD, OQ-022) | FR-035 |

### 9.3. Approval Process Requirements

1. The assistant prepares the draft or proposed operation (FR-031 – FR-033).
2. The assistant presents it for review (FR-034).
3. An authorized human explicitly approves or rejects it.
4. Only after explicit approval may the action be executed (FR-035, SEC-010).
5. No approval, no action.

### 9.4. Open Authorization Questions

The source does not establish that every employee may approve every type of action. The following are `TBD`: who is authorized to approve each action type (OQ-020), approval procedures, delegation, and handling when the CEO is unavailable (OQ-021), and the definition of "consequential" (OQ-022).

---

## 10. Business Rules

| ID | Rule | Source | Related |
|---|---|---|---|
| BUS-001 | A vague suggestion must never be silently converted into a confirmed task. | P1 | FR-010, FR-008 |
| BUS-002 | A statement that indicates a potential commitment but lacks sufficient clarification (e.g., missing owner or deadline) must be explicitly flagged, with the missing information identified. | P1 | FR-010, FR-012 |
| BUS-003 | The assistant must make clear who promised to do what, what they based the commitment on, and which responsibilities remain unresolved. | P1 | FR-007, FR-011, FR-012 |
| BUS-004 | Every factual answer based on internal documentation must be traceable to its source (document title, page/section, effective or revision date). | P3, PR2 | FR-024, FR-025 |
| BUS-005 | Outdated or superseded documentation must not be presented as current without qualification. | P3 | FR-026 |
| BUS-006 | When reliable information cannot be found, the assistant must say so; assumptions or generated information must not be presented as established company policy. | P3, PR8 | FR-027, FR-028 |
| BUS-007 | The assistant must prioritize accuracy, verifiability, and document relevance over producing an answer at all costs. | P3, PR1 | NFR-001 |
| BUS-008 | Information the requesting employee is not authorized to access must never be disclosed, including in generated responses. | P5 | SEC-006, SEC-007 |
| BUS-009 | The assistant must never have more effective access than the user it serves. | P5 | SEC-008 |
| BUS-010 | No external or consequential action (sending an email, creating a task, modifying a business record, confirming a commercial agreement) may be executed without explicit approval from an authorized human. | P4, PR3 | FR-035, SEC-010 |
| BUS-011 | Approval must come from a human with the authority to approve that action (authority definitions TBD). | P4 | FR-035, OQ-020 |
| BUS-012 | Operational summaries must prioritize critical information and avoid unnecessary detail. | P6 | FR-043 |
| BUS-013 | If everything is operating normally, the assistant must say so clearly. | P6 | FR-044 |
| BUS-014 | The assistant must never invent facts, commitments, documents, or operational data. | PR1 | NFR-001 |
| BUS-015 | The assistant is an advisor and executor of approved actions, not a decision-maker; it does not make business decisions independently. | P4, Overall | FR-030 – FR-036 |
| BUS-016 | Incomplete, ambiguous, outdated, or unavailable information must be communicated explicitly. | PR8 | NFR-003 |

No additional company policies have been introduced.

---

## 11. Scope and Boundaries

### 11.1. In Scope (Explicit or Clearly Established)

| # | Capability | Requirements |
|---|---|---|
| 1 | Processing meetings and recordings, speaker distinction, and structured post-meeting reports with commitments, tasks, and flagged incomplete agreements | FR-001 – FR-013 |
| 2 | Automatic pre-meeting briefings on participants and context | FR-014 – FR-022 |
| 3 | Source-traceable, version-aware answers from the internal knowledge base | FR-023 – FR-029 |
| 4 | Drafting and proposing (emails, messages, tasks, record changes) under mandatory human approval | FR-030 – FR-036 |
| 5 | Identity-aware, permission-enforced access to information | FR-037, FR-038, SEC-001 – SEC-012 |
| 6 | Concise, prioritized operational summaries from company management and operational data | FR-039 – FR-045 |
| 7 | Cross-cutting context awareness and proactive preparation | FR-046, FR-047 |

### 11.2. Out of Scope (Explicitly Excluded by Source)

| # | Exclusion | Basis |
|---|---|---|
| 1 | Replacing existing business processes | "Rather than replacing existing business processes…" |
| 2 | Independently making business decisions | "…or independently making decisions"; advisor, not autonomous decision-maker |
| 3 | Executing external or consequential actions without explicit human approval | P4 ("must NEVER") |
| 4 | Bypassing the company's existing access-control policies | P5 |

### 11.3. Undetermined Scope

| # | Potential capability or question | Stakeholder decision required | OQ |
|---|---|---|---|
| 1 | Use by the CEO only vs. other employees and departments | Define initial and future user groups | OQ-028, OQ-029 |
| 2 | Live meeting attendance vs. processing recordings only | Define meeting capture modes and formats (in-person, online, phone) | OQ-004 |
| 3 | Briefings before telephone calls | Define whether calls are covered and how | OQ-026, OQ-027 |
| 4 | Supported languages | Define languages for meetings and documents | OQ-001 |
| 5 | Interaction mode on the manufacturing floor (voice, text, or other) | Define input/output modes | OQ-030 |
| 6 | Which management systems are connected | Identify operational data sources | OQ-023 |
| 7 | Task creation in the company's management system after approval | Identify the task system and required fields | OQ-033 |
| 8 | Which business records the assistant may propose to change | Define record types | OQ-034 |
| 9 | External-party data (B2B clients) in briefings | Define handling and permissions for external-party information | OQ-031 |
| 10 | Notification and delivery channels for proactive briefings and alerts | Define delivery channels and timing | OQ-026 |
| 11 | Auditing of approvals and access | Decide whether required | OQ-039 |
| 12 | Participant interaction with meeting reports (confirmation, correction) | Define review/correction process | OQ-009 |

---

## 12. Business Success Metrics

> **These are proposed measurement categories, not established company targets.** No baselines or targets have been provided; none are invented.

| ID | Metric | Business Objective | Suggested Measurement Approach (Proposed) | Required Data Source | Baseline | Target | Status |
|---|---|---|---|---|---|---|---|
| MET-001 | Time required to prepare for meetings | Remove manual preparation (P2) | Compare time spent preparing before and after introduction | TBD | TBD | TBD | Proposed |
| MET-002 | Number of forgotten or unresolved commitments | Improve accountability (P1) | Count commitments with no owner, deadline, or follow-up over a period | Meeting reports; task records (TBD) | TBD | TBD | Proposed |
| MET-003 | Time spent searching internal documentation | Accelerate knowledge access (P3) | Compare time to obtain a documented answer before and after | TBD | TBD | TBD | Proposed |
| MET-004 | Accuracy of speaker identification and information extraction | Reliable meeting records (P1) | Sample meetings compared against human-verified records | Recordings; verified records | TBD | TBD | Proposed |
| MET-005 | Accuracy of task and commitment identification | Reliable accountability (P1) | Compare identified items against human review, including correct flagging of incomplete agreements | Verified records | TBD | TBD | Proposed |
| MET-006 | Reduction in administrative workload | Reduce admin burden (Overall) | Compare time spent on routine admin tasks before and after | TBD | TBD | TBD | Proposed |
| MET-007 | Time to identify critical operational issues | Immediate visibility (P6) | Time from occurrence to CEO awareness | Operational data; incident records (TBD) | TBD | TBD | Proposed |
| MET-008 | Frequency of unsupported or untraceable AI answers | Reliability (P3, PR1, PR2) | Review a sample of factual answers for source and correctness | Answer samples | TBD | TBD | Proposed |
| MET-009 | Number of unauthorized information disclosure incidents | Confidentiality (P5) | Incident counts from testing and operation | TBD | TBD | TBD | Proposed |
| MET-010 | Number of consequential actions executed without explicit approval | Human control (P4) | Review of action and approval records | TBD | TBD | TBD | Proposed |
| MET-011 | Accuracy and usefulness of pre-meeting briefings | Effective meetings (P2) | CEO assessment of completeness against known open items | TBD | TBD | TBD | Proposed |

---

## 13. Constraints and Known Limitations

| ID | Constraint | Source |
|---|---|---|
| CON-001 | Consequential external actions require explicit authorization from an authorized human. | P4 |
| CON-002 | Access to information must respect the authenticated user's role and permissions; the assistant cannot exceed the user's access. | P5 |
| CON-003 | Access control must be enforced by the application and data infrastructure, not merely by model instructions. | P5 |
| CON-004 | Answers based on internal documents must be reliable and traceable; unsupported answers are unacceptable. | P3 |
| CON-005 | The product depends on internal documents, meeting content, task records, and operational data sources; availability, quality, and currency of these are not yet known. | P1–P3, P6 |
| CON-006 | The product must not replace existing business processes or independently make decisions. | Overall objective |
| CON-007 | The product must not create additional risks or administrative overhead for the CEO. | Overall objective |

No technical limitations have been assumed.

---

## 14. Assumptions

All assumptions are **unvalidated**. Where possible, open questions were recorded instead of assumptions.

| ID | Assumption | Reason | Affected Requirements | Status |
|---|---|---|---|---|
| ASM-001 | The CEO is the initial primary user and approver. | The source is written from the CEO's perspective ("my explicit approval"), but company-wide use is not excluded. | FR-035, BUS-011, Section 5 | Unvalidated (see OQ-029) |
| ASM-002 | Meeting-derived outputs (reports, briefings) are subject to the same confidentiality principles as other information. | The source requires every information retrieval operation to respect access rights. | SEC-011, FR-004, FR-014 | Unvalidated (see OQ-038) |
| ASM-003 | Information about previous commitments and tasks used in briefings comes from previously captured meeting outcomes and the company's task and management systems. | Briefings must include previous agreements and outstanding tasks, but their origin is not stated. | FR-016 – FR-018 | Unvalidated (see OQ-010, OQ-033) |

---

## 15. Open Questions and Unresolved Decisions

| ID | Topic | Question | Reason | Affected Requirements | Decision Dependency | Status |
|---|---|---|---|---|---|---|
| OQ-001 | Languages | Which languages must be supported for meetings, documents, and interaction? | Affects feasibility of transcription, speaker identification, and retrieval. | FR-001 – FR-003, FR-023 | Scope; technology research | Open |
| OQ-002 | Transcription accuracy | What accuracy is required for transcription and extraction of meeting content? | Defines acceptance for meeting reports. | FR-003, NFR-010 | Acceptance criteria; technology selection | Open |
| OQ-003 | Speaker identification | What accuracy is required, and how are unidentifiable speakers handled? | Wrong attribution undermines accountability. | FR-002, NFR-010 | Acceptance criteria; process design | Open |
| OQ-004 | Meeting capture mode | Does the assistant attend meetings live, process recordings, or both? Which meeting types (in-person, online, phone) are covered? | Determines scope of FR-001. | FR-001 | Scope; architecture | Open |
| OQ-005 | Recording and consent | What rules apply to recording meetings and to participant notification and consent? | Legal and organizational compliance. | FR-001 | Feasibility; policy | Open |
| OQ-006 | Audio retention | How long are recordings kept, and who can access or delete them? | Confidentiality and compliance. | FR-001, SEC-011 | Data governance | Open |
| OQ-007 | Report timing | What does "immediately after a meeting" mean in measurable terms? | Defines acceptance. | FR-004, NFR-007 | Acceptance criteria | Open |
| OQ-008 | Report distribution | Who receives meeting reports (CEO only, participants, others)? | Affects confidentiality and accountability. | FR-004, SEC-011 | Access rules | Open |
| OQ-009 | Report review | Can participants confirm, correct, or dispute a report, and can report statements be traced back to the meeting? | Disputed interpretations are a core problem. | FR-004, FR-013 | Process design | Open |
| OQ-010 | Commitment lifecycle | How are commitments stored, tracked, updated, closed, and marked overdue? What is "relevant" prior discussion? | Briefings depend on current commitment status. | FR-016 – FR-018, ASM-003 | Data requirements | Open |
| OQ-011 | Incomplete agreements | What criteria define a potential commitment and which missing elements (owner, deadline, outcome) trigger a flag? | Core to the "particularly important" requirement. | FR-010, BUS-002 | Acceptance criteria | Open |
| OQ-012 | Commitment basis | What does "what they based their commitment on" cover (stated rationale, preceding discussion, other)? | Needed to specify FR-011. | FR-011 | Report format | Open |
| OQ-013 | Document formats | Which internal document formats and repositories must be supported? | Scope of the knowledge base. | FR-023, FR-029 | Scope; technology research | Open |
| OQ-014 | Document versioning | How are versions, effective dates, and superseded documents recorded and determined? | Needed to identify the current version. | FR-025, FR-026, BUS-005 | Process; data requirements | Open |
| OQ-015 | Conflicting documents | How should conflicts between documents or versions be handled? | Avoids misleading answers. | FR-026 | Business rules | Open |
| OQ-016 | Identity sources | What is the authoritative source of employee identities and organizational roles? | Basis for RBAC and speaker mapping. | SEC-001, FR-002, FR-015 | Integration scope | Open |
| OQ-017 | Permission hierarchy | What are the roles, levels, and the exact hierarchy of permissions? | Prerequisite for any permission model. | SEC-002 – SEC-005, SEC-012 | Security design | Open |
| OQ-018 | Authentication context | How is a user's identity established and verified in the business context? | SEC-001 depends on it. | SEC-001 | Security design | Open |
| OQ-019 | Existing policies | Where are existing access-control policies defined, and at what granularity are they applied (document, section, record)? | The assistant must not bypass them. | SEC-003, SEC-004 | Security design | Open |
| OQ-020 | Approval authority | Who is authorized to approve each type of action? | Not every employee may approve everything. | FR-035, BUS-011 | Workflow design | Open |
| OQ-021 | Approval procedure | How does approval work (delegation, absence of CEO, multiple approvers, edits after approval)? | Needed to specify the approval gate. | FR-035, FR-036 | Workflow design | Open |
| OQ-022 | Consequential actions | Which actions are consequential beyond those listed? | Defines the boundary of the approval gate. | FR-035 | Scope | Open |
| OQ-023 | Operational data sources | Which management systems and operational data sources contain the required data? | Scope of P6. | FR-039, FR-041 | Integration scope | Open |
| OQ-024 | Data freshness | How frequently must operational information be updated? | Defines "current". | FR-039, NFR-008 | Acceptance criteria | Open |
| OQ-025 | Critical alerts | What constitutes a critical operational alert? How is "expected performance" defined? | Needed for prioritization. | FR-042, FR-043, FR-045 | Business rules | Open |
| OQ-026 | Proactive delivery | When, how, and through which channel should proactive briefings and alerts be delivered? Are calls covered? | Defines proactive behavior. | FR-022, FR-047 | UX design | Open |
| OQ-027 | Meeting sources | What defines upcoming meetings and their participants (schedule source)? Which meetings are in scope? | Briefings depend on knowing meetings and attendees. | FR-014, FR-020, FR-046 | Integration scope | Open |
| OQ-028 | Departments and groups | Which departments and user groups will use the system? | Scope. | Section 5, NFR-012 | Scope | Open |
| OQ-029 | CEO-only vs. company-wide | Is the assistant for the CEO initially, or for broader company-wide use? | Determines security and scalability emphasis. | ASM-001, SEC-002 | Scope | Open |
| OQ-030 | Interaction mode | How does the CEO ask short questions on the manufacturing floor (voice, text, other)? Which devices? | Defines usability. | FR-040, NFR-005, NFR-011 | UX design | Open |
| OQ-031 | External parties | What information about B2B clients and external partners may be held and shown? Does the assistant communicate with them (after approval)? | Affects privacy and scope. | FR-015, FR-031 | Scope | Open |
| OQ-032 | Drafted communications | In what languages, tone, and templates are drafts produced? Who is the named sender? | Affects FR-031. | FR-031 | Specification | Open |
| OQ-033 | Task management | Which task management system holds tasks, and which fields are mandatory? | Needed for FR-017 and FR-032. | FR-017, FR-032 | Integration scope | Open |
| OQ-034 | Business records | Which business records may be subject to proposed changes? | Defines FR-033 scope. | FR-033 | Scope | Open |
| OQ-035 | Legal compliance | What legal, privacy, or regulatory requirements apply to recordings and personal data? | Compliance. | FR-001, SEC-011 | Policy | Open |
| OQ-036 | Metrics | What are the baselines and targets for success metrics, and how will accuracy and security be evaluated? | Needed to measure value. | Section 12 | Acceptance | Open |
| OQ-037 | Priorities | What is the relative priority and delivery order of the six problem areas? | Planning. | All FR | Planning | Open |
| OQ-038 | Mixed-access meetings | How should meeting outputs be handled when participants have different access levels? | Confidentiality of meeting-derived content. | SEC-011, ASM-002 | Access rules | Open |
| OQ-039 | Audit trail | Is a record of approvals, rejections, and access required? | Accountability. | NFR-013 | Scope | Open |
| OQ-040 | Responsible persons | What source defines the person responsible for equipment, processes, or alerts? | Needed for FR-045. | FR-045 | Integration scope | Open |
| OQ-041 | Restricted-information disclosure | May the assistant acknowledge that restricted information exists when refusing a request? | Even acknowledgement may leak information. | FR-038, SEC-007 | Security design | Open |

---

## 16. Requirement Traceability Matrix

| Source Problem / Principle | Related Requirement IDs | Expected Business Outcome | Unresolved Dependencies |
|---|---|---|---|
| **P1** — Losing meeting outcomes and accountability | FR-001 – FR-013, BUS-001 – BUS-003, NFR-001, NFR-003, NFR-010, SEC-011 | Accurate, attributable meeting records; clear owners and deadlines; incomplete agreements flagged | OQ-001 – OQ-012, OQ-035, OQ-038 |
| **P2** — Lack of context before meetings | FR-014 – FR-022, FR-046, FR-047, NFR-004, NFR-006, NFR-007 | The CEO enters meetings with relevant context without manual search | OQ-010, OQ-026, OQ-027, OQ-031 |
| **P3** — Time lost searching internal documentation | FR-023 – FR-029, BUS-004 – BUS-007, NFR-001 – NFR-003 | Fast, trustworthy, source-backed, version-aware answers | OQ-013 – OQ-015 |
| **P4** — Concerns about AI autonomy | FR-030 – FR-036, BUS-010, BUS-011, BUS-015, SEC-010, NFR-013 | No consequential action without explicit authorized approval | OQ-020 – OQ-022, OQ-032 – OQ-034, OQ-039 |
| **P5** — Protection of confidential information | SEC-001 – SEC-012, FR-037, FR-038, BUS-008, BUS-009 | No unauthorized disclosure; assistant never exceeds the user's access | OQ-016 – OQ-019, OQ-038, OQ-041 |
| **P6** — Lack of immediate operational visibility | FR-039 – FR-045, BUS-012, BUS-013, NFR-004, NFR-005, NFR-008, NFR-011, SEC-012 | Immediate, concise, prioritized understanding of company condition | OQ-023 – OQ-025, OQ-030, OQ-040 |
| **PR1** — Accuracy over fluency | NFR-001, BUS-007, BUS-014, FR-027, FR-028 | No invented facts, commitments, documents, or data | OQ-036 |
| **PR2** — Traceability | NFR-002, BUS-004, FR-024, FR-025, FR-013 | Important statements are source-backed | OQ-009, OQ-014 |
| **PR3** — Human control | FR-035, BUS-010, BUS-011, SEC-010 | Explicit authorization before consequential actions | OQ-020 – OQ-022 |
| **PR4** — Security by design | SEC-001 – SEC-012, BUS-008, BUS-009 | Every operation respects the user's permissions | OQ-016 – OQ-019 |
| **PR5** — Context awareness | NFR-006, FR-046 | Relationships between entities are understood | OQ-016, OQ-027 |
| **PR6** — Operational simplicity | NFR-004, NFR-005, FR-021, FR-043 | Minimal information burden on the CEO | OQ-030 |
| **PR7** — Proactive assistance | FR-047, FR-014, FR-022 | Information prepared at the right time | OQ-026 |
| **PR8** — Clear uncertainty | NFR-003, BUS-006, BUS-016, FR-010, FR-026, FR-027 | Incomplete, ambiguous, outdated, or unavailable information is explicitly communicated | None identified |
| **Overall objective** — Reduce admin load; prevent information loss; improve accountability; accelerate knowledge; give operational visibility; reduce risk | All of the above; NFR-009; Section 12 metrics | More CEO time for important decisions, with control and without added risk or overhead | OQ-028, OQ-029, OQ-036, OQ-037 |

---

## 17. Glossary

| Term | Definition (as used in this document) |
|---|---|
| **AI Executive Assistant** | The proposed product: an AI-powered "digital executive secretary" for Photoprint that analyzes, retrieves, drafts, and proposes, but does not make business decisions or execute consequential actions without approval. |
| **Human-in-the-Loop** | The principle that an authorized human must explicitly review and approve any consequential or external action before it is executed. |
| **Business Requirement** | A statement of what the business needs the product to accomplish and why, independent of implementation. |
| **Functional Requirement (FR)** | A requirement specifying a capability or behavior the product must provide. |
| **Non-Functional Requirement (NFR)** | A requirement specifying a quality attribute (e.g., accuracy, usability, timeliness) rather than a specific behavior. |
| **Security Requirement (SEC)** | A requirement concerning confidentiality, identity, and access control. |
| **Business Rule (BUS)** | A rule that constrains how the product must behave, derived from the business's expectations. |
| **Role-Based Access Control (RBAC)** | An approach where a user's access to information is determined by their organizational role. Named explicitly in the source; its implementation is not specified here. |
| **Effective Access** | The set of information the assistant can retrieve or reveal during an interaction. It must never exceed the access of the user being served. |
| **Meeting Commitment** | A statement made by a participant in which they undertake to do something. An *explicit* commitment names who will do what; a *potential* commitment lacks sufficient clarification (e.g., owner or deadline) and must be flagged. |
| **Incomplete Agreement** | A statement that suggests a commitment or action but lacks necessary information (such as who is responsible or when). |
| **Meeting Report** | The concise, structured, factual record generated after a meeting (FR-004). |
| **Pre-Meeting Briefing** | A concise summary prepared before a meeting or call containing participant, history, task, and issue context (FR-014). |
| **Operational Alert** | An indication that something in the company's operations requires attention; what qualifies as *critical* is TBD (OQ-025). |
| **Internal Knowledge Base** | Photoprint's collection of internal documentation: regulations, procedures, manuals, instructions, policies, guidelines, and other corporate documents. |
| **Source Traceability** | The ability to identify the exact origin of a statement (e.g., document title, page or section, and effective date). |
| **Superseded / Outdated Document** | A document version that has been replaced or is no longer current; it must not be presented as current without qualification. |
| **Proposed Consideration** | An idea not established in the source that requires stakeholder validation before becoming a requirement. |
| **TBD** | To Be Determined: information not yet provided, tracked in the Open Questions. |

---

## Appendix A — Quality Review Record

| Check | Result |
|---|---|
| All six business problems documented separately (Section 3) | Yes |
| All eight core principles included (Section 4.6) | Yes |
| Source examples retained (warehouse statement, Head of Manufacturing briefing, Moderation Regulations citation, Sales vs. HR salaries, Printing Machine No. 2 alert) | Yes |
| Overall product objective preserved (Section 4.7) | Yes |
| Requirement IDs unique (FR-001–FR-047, NFR-001–NFR-013, SEC-001–SEC-012, BUS-001–BUS-016) | Yes |
| Every unresolved decision appears in Section 15 | Yes |
| Technologies, architectures, integrations, numeric targets, or permission matrices introduced | None |
| Derived/proposed items clearly marked | Yes (FR-013, FR-036, SEC-010, SEC-011, NFR-012, NFR-013) |

*End of document.*

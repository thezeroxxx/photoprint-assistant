# Product Vision — Photoprint AI Executive Assistant

**Status:** Approved by the Product Owner, 2026-11-12
**Source:** /define-product session, Step 1. Original business context: PROJECT_BRIEF.md (not modified).

## Vision
The Photoprint AI Executive Assistant gives the CEO his time back. It takes over a significant part of the routine work normally handled by a human secretary, and it works as one coherent assistant experience, not a collection of disconnected tools. The CEO spends less effort on cognitive and administrative load and more on decisions and higher-value activities.

The CEO keeps all decision authority. Control (commitments and actions are not lost), awareness (relevant context is available when needed) and trust (information is reliable) are the qualities that make the assistant dependable.

## Scope levels
| Level | Definition | Status |
|---|---|---|
| Initial product | Designed exclusively for the CEO, who is the sole end-user and the sole human approver. Additional roles and multi-user functionality are outside it. | Confirmed |
| MVP | A subset of the initial product. Capabilities not yet defined; none of the long-term areas is MVP scope by default. | Scope open |
| Long-term vision | The CEO assistant may potentially evolve into a unified corporate AI Assistant platform, integrated with the CRM and other corporate systems, with role-specific assistant experiences for employees, managers and executives. | Potential direction only; not an implementation commitment and not part of the initial product |

## Long-term capability areas
1. Tracking commitments and tasks.
2. Preparing reports and briefings.
3. Organizing information and answering questions.
4. Drafting communications and preparing actions for approval.
5. Planning and scheduling, including calendar organization and time allocation (new area, to be validated with the client).
6. Decision support through analysis, relevant information, options and recommendations (advisory only).

CRM-based charts and trend analysis need clarification.

## Approval principle
Not every assistant action needs the CEO's approval. The assistant works independently on analysis, search, reports, recommendations, drafts, proposed tasks and proposed record changes (FR-030 to FR-033). It requires the CEO's explicit approval for the actions the BRD lists: sending emails or messages, creating tasks, modifying business records, confirming commercial agreements, and other consequential external operations (FR-035, BUS-010).

## Not intended to
- Make or execute consequential decisions, or take actions requiring approval, without human authorization (N1).
- Replace Photoprint's corporate systems or business processes, such as the CRM or task management system. Those systems remain authoritative for their business data, and the assistant interacts with them through appropriate integration mechanisms. The assistant may keep its own storage for assistant-specific information such as interaction history, meeting context and derived information (N2).
- Become a full-scale BI or general-purpose dashboard platform. Reporting and analytics support the CEO's understanding and decisions (N3).
- Serve as a general-purpose assistant for unrelated topics; the focus is Photoprint's business and the CEO's professional responsibilities (N4).
- Send consequential communications or execute actions affecting employees or external parties without the required CEO approval (N6).

## Success measurement
- Primary: the CEO's own judgment that the assistant reduces his cognitive and administrative workload and gives him more time for higher-value activities.
- Supporting evidence:
  - Time saved on specific administrative activities, before versus after.
  - Operational reliability: fewer lost or unresolved commitments, and fewer answers requiring manual verification.
  - Practical usefulness: outputs and actions that reduce effort and do not create extra work.
- No numerical targets at this stage. The baseline comes first, and measurable targets are defined later.

## Kept open
- Data retention: which copies of business data the assistant may retain (SEC-003, OQ-006, OQ-035).
- Permission model: how much of SEC-002 to SEC-005 applies to the initial product versus the long term. SEC-008 and SEC-009 apply from the start.
- Integration approach: CRM, data-source and corporate-system integration details. No CRM access exists today; data-source independence remains a constraint.
- Mobile platform (iOS, Android or both).
- Approval classification of new capabilities, such as planning and scheduling (related to OQ-022).
- The definition of "consequential actions" beyond the BRD's list (OQ-022).

## Traceability
- From the BRD: overall objective (section 4.7), P1–P6, PR1–PR8, BUS-010, BUS-015, FR-030 to FR-035.
- New from the Product Owner, not in the BRD: planning and scheduling; CRM charts and trends; the company-wide platform direction; assistant-owned storage; the BI, general-purpose and CEO-only boundaries.

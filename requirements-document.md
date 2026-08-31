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

other token
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
# BuildLink — Product Requirements Document

## 1. Concept Summary
A marketplace platform connecting **customers** who need architectural/structural design or construction work with:
- **Design professionals** (civil engineers, architects, house designers) who create and revise designs.
- **Construction companies** who provide execution plans and labor.

The platform owns the customer relationship end-to-end: matching, communication, revisions, and **escrowed payments** (platform holds and approves payouts).

## 2. User Roles

### 2.1 Customer
- Posts a design request (project brief).
- Selects requirements/features needed.
- Filters and picks a professional (or gets matched).
- Reviews design drafts, requests revisions.
- Pays platform (funds held in escrow) and releases payment on milestone approval.
- Optionally requests a construction company for build execution + labor.

### 2.2 Design Professional (Engineer / Architect / House Designer)
- Registers with verified credentials, license number, portfolio, specialization.
- Sets availability, service area, pricing model (fixed/hourly/per sq. ft).
- Receives matched project requests or applies to open ones.
- Uploads designs (drawings, CAD/PDF, 3D renders), submits revisions.
- Gets paid via platform after milestone approval.

### 2.3 Construction Company
- Registers company profile: certifications, past projects, crew size, equipment, service region.
- Bids/submits construction plans + cost & labor estimates against a finalized design.
- Manages project timeline, labor assignment, progress updates.
- Gets paid via milestone-based platform-approved disbursement.

### 2.4 Platform Admin (You)
- Verifies professional/company credentials before activation.
- Manages the payment escrow: approves release of funds per milestone.
- Resolves disputes, moderates reviews/content.
- Oversees matching algorithm / manual override.
- Monitors quality (ratings, complaints, compliance documents).

## 3. Core User Flows

### 3.1 Customer Request Flow
1. Customer signs up / logs in.
2. Describes the project (free text + guided prompts): type of structure, purpose, location, budget range, timeline.
3. Selects required features via checklist (e.g., number of floors, bedrooms, plot size, style, sustainability requirements, structural type, etc.) — dynamic based on project type.
4. Chooses professional type needed (Architect / Civil Engineer / Structural Engineer / Interior Designer) with **filters**:
   - Specialization
   - Years of experience
   - Rating
   - Price range
   - Location / willingness to travel or remote
   - Availability / turnaround time
   - License verification badge
   - Language
5. Platform suggests matching professionals (ranked); customer selects one, or requests platform auto-assignment.
6. Customer funds escrow for agreed milestone(s).
7. Professional delivers design draft(s); customer reviews, requests revisions (bounded by contract terms) or approves.
8. On approval, customer optionally proceeds to construction phase.

### 3.2 Construction Phase Flow
1. Customer opens finalized design to "Find a Construction Company."
2. Filters:
   - Service region
   - Project size capability
   - Certifications/licenses
   - Crew/labor availability
   - Equipment owned
   - Price estimate range
   - Timeline capability
   - Ratings/past project gallery
3. Customer selects a company; company submits a construction plan + cost & labor breakdown.
4. Customer approves plan, funds milestone escrow.
5. Company executes; provides progress updates/photos; customer approves milestone completion; platform releases payment.

### 3.3 Payment Flow (Escrow Model)
1. Customer pays into platform-held escrow per milestone (not directly to professional/company).
2. Milestone deliverable submitted.
3. Customer reviews & approves (or disputes).
4. Admin reviews approval request (fraud/quality check) and releases funds to professional/company, minus platform commission.
5. Disputes go to an admin-mediated resolution flow.

## 4. Feature List by Module

### 4.1 Authentication & Onboarding
- Role-based signup (Customer / Professional / Company / Admin).
- Professional & company KYC: license upload, ID verification, certification docs.
- Profile completion wizard.

### 4.2 Project Intake (Customer)
- Guided form: project type → dynamic requirement checklist → budget/timeline → location.
- Attachments: reference images, plot documents, survey files.
- Save draft / edit before submission.

### 4.3 Marketplace & Matching
- Searchable, filterable directory of professionals and companies.
- Matching engine (rule-based initially: filters + rating + availability; ML-based later).
- Profile pages: portfolio, reviews, certifications, response time, price range.

### 4.4 Project Workspace (per project)
- Chat/messaging between customer and professional/company.
- File sharing & version history for designs (drawing revisions tracked).
- Milestone tracker with status (Requested → In Progress → Submitted → Approved → Paid).
- Revision request tool with comments pinned to design areas (if feasible).

### 4.5 Payments & Escrow
- Wallet/escrow ledger per project.
- Milestone-based invoicing.
- Admin approval queue for fund release.
- Payout history, commission tracking, tax invoice generation.
- Support for multiple payment methods (card, bank transfer, mobile wallets — relevant to your market).

### 4.6 Construction Company Module
- Company profile with crew/equipment/certifications.
- Bid submission on finalized designs.
- Labor scheduling & progress reporting (with photo/video updates).
- Materials/cost estimate breakdown tool.

### 4.7 Reviews & Trust
- Two-way ratings (customer ↔ professional/company).
- Verified badges (license-checked, top-rated, fast-responder).
- Dispute/report system.

### 4.8 Admin Panel
- User/professional/company verification queue.
- Escrow approval dashboard.
- Dispute resolution console.
- Analytics: active projects, GMV, take-rate, churn.

### 4.9 Notifications
- Email/SMS/push for: new match, message received, milestone submitted, payment released, revision requested.

## 5. Non-Functional Requirements
- **Security**: encrypted storage of KYC documents, PCI-DSS-compliant payment handling (likely via a payment processor like Stripe/PayPal/local gateway — platform should not store raw card data).
- **Scalability**: support growth from single-city to multi-region marketplace.
- **File handling**: support large CAD/PDF/image files with version control.
- **Compliance**: verify professional licensing requirements vary by country/state — legal review needed before launch.
- **Auditability**: full transaction and approval logs for dispute resolution.

## 6. Suggested Tech Stack (for later build)
- Frontend: React / Next.js (web), React Native or Flutter (mobile)
- Backend: Node.js/NestJS or Django
- Database: PostgreSQL (relational data), S3-compatible storage for files
- Payments: Stripe Connect (built-in escrow-like split payments) or a local gateway with manual hold/release
- Search/Filter: Postgres full-text or Elasticsearch/Algolia for professional directory
- Real-time chat: WebSocket-based (e.g., Socket.io) or a service like Sendbird

## 7. MVP Scope (Recommended First Version)
1. Customer signup + project intake form (single project type: residential house).
2. Professional signup + verification (manual by admin initially).
3. Basic filterable directory (specialization, price, rating, location).
4. Messaging + file upload per project.
5. Milestone-based escrow with **manual admin approval** (no automated release logic yet).
6. Basic reviews.
7. Construction company module can be phase 2, once design-side marketplace has traction.

## 8. Open Questions to Resolve Before Building
- Which country/market first? (Affects licensing verification rules & payment gateway choice.)
- Commission model: flat % per transaction, subscription for professionals, or both?
- Who handles legal liability if a design has structural issues — platform, professional, or contractual disclaimer?
- Manual matching vs. algorithmic matching at launch?
- Will construction/labor module launch simultaneously with design module, or later?


#f5dadf
#a27732
#552619
#fbeae7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

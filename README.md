# BuildLink — AI-Powered Construction Ecosystem

BuildLink is a full-stack AI-powered platform that automates the entire residential design workflow in Pakistan — from voice-based project creation in Urdu to AI floor plans, smart engineer matching, escrow payments, and milestone-tracked delivery.

## 🎯 Problem

Pakistan builds 300,000+ houses/year in a $15B+ construction industry with **zero dominant digital platform**:
- No cost transparency — budgets overrun by 30–50%
- No verified engineer marketplace — word-of-mouth only
- No trust mechanisms — no escrow, no milestones, no revision tracking

## 💡 Solution

One platform that covers every step — powered by Google Gemini AI:

```
Voice/Text Brief → AI Cost Estimate → ML-Matched Engineer → AI Floor Plan → Milestone Delivery → Escrow Release
```

## 🤖 AI Features (7 Gemini-Powered Systems)

| Feature | Description |
|---------|-------------|
| **Voice-to-Project** | Speak in Urdu or English — AI creates full project brief |
| **AI Floor Plans** | Generates layouts with doors, windows, dimensions. Download PNG/SVG |
| **NLP Cost Estimator** | Plain text → localized PKR cost breakdown with confidence score |
| **Smart Engineer Matching** | ML scoring by specialization, location, experience, project fit |
| **Risk Analysis** | AI scans for structural, regulatory, budget risks with mitigations |
| **Material Breakdown** | AI-generated bill of quantities with costs |
| **Construction Chatbot** | Project-aware AI assistant for any construction question |

## 🎤 Accessibility-First: Voice AI

42% of Pakistan's population is illiterate. BuildLink is the **first construction platform** where you can:
- **Create a project** entirely by speaking in Urdu (`ur-PK`)
- **Send messages** using voice-to-text on every chat input
- **Negotiate rates** by speaking amounts (e.g., "paanch lakh" → 500,000)

No typing required at any step.

## 🏗️ Platform Features

- **Escrow Payments** — milestone-based, auto-release on approval
- **8 Sequential Design Milestones** — approve / revise (with comments) / reject
- **Deliverables System** — upload per milestone, submit for review
- **Verified Engineers** — license verification, admin approval, ratings
- **Chat & Rate Negotiation** — voice-enabled messaging and rate proposals
- **Admin Dashboard** — user management, engineer verification, project oversight
- **Floor Plan Export** — download as high-res PNG (3×) or SVG vector

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, React Router, Context API, Axios |
| Backend | Node.js, Express.js, JWT, bcrypt |
| Database | MongoDB with Mongoose ODM |
| AI | Google Gemini via `@google/genai` SDK |
| Voice | Web Speech API (`ur-PK`, `en-US`) |
| Security | Helmet, CORS, express-rate-limit, express-validator |
| File Handling | Multer for deliverable uploads |
| Floor Plans | Dynamic SVG rendering with PNG export |

## 📁 Project Structure

```
buildlink/
├── backend/
│   ├── config/         # Database connection
│   ├── middleware/      # Auth (JWT), role-based access
│   ├── models/          # User, EngineerProfile, Project
│   ├── routes/          # Auth, Projects, Engineers, Admin, Floor Plans
│   ├── services/        # Gemini AI service (7 AI features)
│   ├── uploads/         # Deliverable file storage
│   └── server.js        # Express app with rate limiting
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, AIChatbot, VoiceToProject
│   │   ├── context/     # AuthContext (JWT state)
│   │   ├── pages/       # All page components
│   │   └── services/    # API client (Axios)
│   └── public/
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and Gemini API key
npm install
node server.js
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The app runs at `http://localhost:3000` with the API at `http://localhost:5000`.

## 👥 User Roles

| Role | Flow |
|------|------|
| **Customer** | Create project (voice/text) → Get AI estimate → Select engineer → Fund escrow → Track milestones → Approve/revise → Rate |
| **Engineer** | Browse projects → Apply → Accept when selected → Negotiate rate → Deliver milestones → Get paid |
| **Admin** | Verify engineers → Manage users → Oversee projects → Platform analytics |

## 📋 Design Milestones (Sequential)

1. Site Analysis & Client Brief
2. Conceptual Design
3. Detailed Architectural Drawings
4. Structural Engineering Design
5. MEP Design
6. Cost Estimation & BOQ
7. Regulatory Submission
8. Final Design Package Handover

Each milestone must be **approved** before the next can start. Customers can **approve**, **request revision** (with comments), or **reject**. Escrow auto-releases on approval.

## 📄 License

Built for the Al-Khidmat Foundation AI Hackathon 2026.

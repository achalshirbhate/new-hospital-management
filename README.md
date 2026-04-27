# Hospital Management System

Full-stack web app with strict role-based access control.

## Roles
| Role | Access |
|------|--------|
| `MAIN_DOCTOR` | Full admin — approves referrals, chat tokens, manages doctors, views finance |
| `DOCTOR` | Add patients, upload reports, request referrals (via MAIN_DOCTOR) |
| `PATIENT` | View profile/reports, request chat (requires MAIN_DOCTOR approval) |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

### Backend
```bash
cd backend
npm install
node seed.js        # seed sample data
npm run dev         # starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm start           # starts on port 3000
```

### Docker (optional)
```bash
docker-compose up --build
```

## Sample Credentials (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Main Doctor | admin@hospital.com | password123 |
| Doctor | sarah@hospital.com | password123 |
| Doctor | mike@hospital.com | password123 |
| Patient | john@patient.com | password123 |
| Patient | emily@patient.com | password123 |

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |

### Doctors
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/doctors` | MAIN_DOCTOR |
| POST | `/api/doctors` | MAIN_DOCTOR |
| DELETE | `/api/doctors/:id` | MAIN_DOCTOR |

### Patients
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/patients` | MAIN_DOCTOR, DOCTOR |
| GET | `/api/patients/me` | PATIENT |
| POST | `/api/patients` | MAIN_DOCTOR, DOCTOR |
| PUT | `/api/patients/:id` | MAIN_DOCTOR, DOCTOR |

### Referrals
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/referrals` | All (filtered by role) |
| POST | `/api/referrals` | DOCTOR |
| PUT | `/api/referrals/:id/approve` | MAIN_DOCTOR |
| PUT | `/api/referrals/:id/reject` | MAIN_DOCTOR |

### Chat Tokens
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/chat-token` | All (filtered) |
| POST | `/api/chat-token/request` | PATIENT |
| PUT | `/api/chat-token/:id/approve` | MAIN_DOCTOR |
| PUT | `/api/chat-token/:id/reject` | MAIN_DOCTOR |
| GET | `/api/chat-token/validate/:token` | Authenticated |

### Reports
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/reports` | All (filtered) |
| POST | `/api/reports` | MAIN_DOCTOR, DOCTOR |
| DELETE | `/api/reports/:id` | MAIN_DOCTOR |

### Dashboard
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/dashboard` | MAIN_DOCTOR |

### Finance
| Method | Endpoint | Access |
|--------|----------|--------|
| GET/POST/DELETE | `/api/revenue/revenue` | MAIN_DOCTOR |
| GET/POST/DELETE | `/api/revenue/expense` | MAIN_DOCTOR |

### LaunchPad
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/launchpad` | MAIN_DOCTOR |
| POST | `/api/launchpad` | Authenticated |
| DELETE | `/api/launchpad/:id` | MAIN_DOCTOR |

## Key Rules Enforced
- Doctors **cannot** communicate directly — all referrals go through MAIN_DOCTOR
- Chat tokens require MAIN_DOCTOR approval and auto-expire after **30 minutes** (cron job)
- File uploads (PDF/images) max 10MB via Multer
- JWT tokens expire in 7 days
- Socket.io powers real-time chat within approved token windows

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trajectory Annotation Website is a full-stack web application for analyzing pedestrian trajectory data with knot-finding capabilities. The system consists of:
- **Backend**: Spring Boot 3 REST API with PostgreSQL
- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Dataset**: Python scripts for trajectory data processing

## Key Commands

### Backend (Spring Boot)
```bash
cd Backend
./mvnw clean install          # Install dependencies
./mvnw spring-boot:run        # Run backend (http://localhost:8080)
./mvnw test                   # Run tests
```

### Frontend (Next.js)
```bash
cd Frontend
npm install                   # Install dependencies
npm run dev                   # Run dev server (http://localhost:3000)
npm run build                 # Build for production
npm start                     # Run production build
npm run lint                  # Run ESLint
```

### Data Processing (Python)
```bash
cd Dataset
pip install pandas tabulate seaborn matplotlib scipy numpy tti_dataset_tools
python export_data.py         # Generate trajectory_data.json
```

### Database Setup
```bash
sudo -u postgres createdb surveydb
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE surveydb TO postgres;"
```

### Full Setup
```bash
./setup.sh                    # Automated setup script
```

## Architecture Overview

### Backend Structure (`Backend/src/main/java/com/example/surveybackend/`)

- **entity/**: JPA entities for database tables
  - `TrajectoryData`: Stores trajectory points (sceneId, uniqueTrackId, localX, localY)
  - `KnotAnnotation`: Stores user annotations (sessionId, trackId, x, y, relativeOrder)
  - `Admin`: Admin user authentication

- **repository/**: Spring Data JPA repositories for database access
  - Standard CRUD operations plus custom queries

- **service/**: Business logic layer
  - `TrajectoryDataService`: Manages trajectory data retrieval and random track selection
  - `KnotAnnotationService`: Handles annotation storage and retrieval by session
  - `AdminService`: Admin authentication with BCrypt password hashing
  - `SubmissionService`: Password validation for annotation submissions

- **controller/**: REST API endpoints
  - `SurveyController`: Trajectory and annotation endpoints (`/api/trajectories`, `/api/annotations`)
  - `AdminController`: Admin authentication (`/api/admin/login`)
  - `PasswordUtilController`: Utility for generating BCrypt hashes

- **dto/**: Data transfer objects for API requests/responses

- **config/**: CORS configuration allowing frontend cross-origin requests

### Frontend Structure (`Frontend/src/`)

- **app/**: Next.js App Router pages
  - `page.tsx`: Home page
  - `placeknots/`: Interactive knot annotation interface (80KB component with Recharts visualization)
  - `sys2025/`: Admin panel with dashboard, tracks management, and detail views
  - `knot-comparison/`: Knot comparison visualization
  - `test-password/`: Password testing utility

- **components/**: Reusable React components
  - `ui/`: shadcn/ui components (button, dialog, tabs, tooltip, etc.)
  - `Sidebar.tsx`: Navigation sidebar
  - `SubmissionPasswordModal.tsx`: Password modal for submissions

- **lib/**: Utility libraries
  - `api.ts`: Axios-based API client with TypeScript interfaces
  - `utils.ts`: Utility functions (Tailwind merge)

### Data Flow

1. **Data Processing**: Python scripts in `Dataset/` read CSV files, clean trajectories, transform coordinates (rotate south-bound 180°), and export to `trajectory_data.json`

2. **Backend Initialization**: Spring Boot reads `trajectory_data.json` on startup and populates PostgreSQL database (DDL mode: `create-drop`)

3. **Survey Workflow**:
   - Frontend requests random track IDs via `/api/trajectories/random/{count}`
   - User annotates knots on trajectory curves in interactive canvas
   - Submissions POST to `/api/annotations/submit` with session ID and password validation
   - Annotations stored with session tracking for later review

4. **Admin Workflow**:
   - Admin logs in via `/api/admin/login` with BCrypt-hashed password
   - Dashboard shows statistics and session summaries
   - Track management allows browsing individual trajectories
   - Detailed views use Canvas API for advanced visualization with path connections

## Critical Configuration

### Backend Config (`Backend/src/main/resources/application.properties`)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/surveydb
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=create-drop  # Changes to 'update' for production!

# Admin credentials (hashed)
admin.default.username=a7f32c9b4e218f6d
admin.default.password=c9e7b2d19f0a36a4

# Submission password (hashed)
submission.password=4be91df83c7e21b0
```

**IMPORTANT**: `spring.jpa.hibernate.ddl-auto=create-drop` drops the database on shutdown. Change to `update` for production to preserve data.

### Frontend API Config (`Frontend/src/lib/api.ts`)
```typescript
const BASE_URL = "/api";  // Uses Next.js rewrites or proxy
// Production: "https://trajectory-survey.twiggle.tech/api"
```

### Data Processing Config (`Dataset/export_data.py`)
```python
dataDir = "/home/mushfiqur/vscode/knot-finding/location-2"  # Update this path!
sceneId = 210
date = "2023-05-04"
fps = 10
```

## Data Requirements

The application requires trajectory CSV files in the `dataDir`:
- `{date}-fps-{fps}-scene-{sceneId}-pedestrians.csv`
- `{date}-fps-{fps}-scene-{sceneId}-others.csv`
- `{date}-fps-{fps}-scene-{sceneId}-meta.csv`

Required columns:
- `uniqueTrackId`, `sceneX`, `sceneY`, `sceneXVelocity`, `sceneYVelocity`, `verticalDirection`

The Python script uses `tti_dataset_tools` library for:
- Trajectory transformation (local coordinate system)
- Cleaning (speed/displacement filtering)
- Rotation (south-bound trajectories rotated 180°)

## Key API Endpoints

### Trajectory Data
- `GET /api/trajectories` - All trajectory data
- `GET /api/trajectories/unique-track-ids` - All track IDs
- `GET /api/trajectories/track/{id}` - Specific track
- `POST /api/trajectories/tracks` - Multiple tracks
- `GET /api/trajectories/random/{count}` - Random track IDs

### Annotations
- `POST /api/annotations/submit` - Submit knots (requires password)
- `GET /api/annotations/session/{sessionId}` - Session annotations
- `GET /api/annotations` - All annotations

### Admin
- `POST /api/admin/login` - Authentication
- `POST /api/validate-submission-password` - Validate submission password
- `GET /api/util/hash-password?password=...` - Generate BCrypt hash

## State Management

- **Frontend**: React state hooks (no Redux/Zustand)
- **Admin Auth**: Session-based with localStorage persistence
- **Annotation Sessions**: UUID-based session IDs for grouping submissions

## Visualization Technologies

- **Recharts**: Primary library for trajectory curve visualization in `/placeknots`
- **Canvas API**: Advanced rendering in admin dashboard for trajectory-ordered path connections
- **Konva/React-Konva**: Available for interactive canvas manipulation

## Development Notes

- **CORS**: Backend allows all origins (`@CrossOrigin(origins = "*")`) - restrict in production
- **Password Hashing**: Uses BCrypt via Spring Security Crypto (not full Spring Security)
- **Database Schema**: Auto-managed by JPA (check `ddl-auto` setting!)
- **TypeScript**: Strict type checking enabled in Frontend
- **Coordinate Systems**: Local coordinates from trajectory transformer, not raw scene coordinates
- **South-bound Handling**: Automatically rotated 180° for consistent orientation

## Common Workflows

### Adding a New API Endpoint
1. Create DTO in `Backend/src/main/java/com/example/surveybackend/dto/`
2. Add service method in appropriate service class
3. Add controller endpoint in `SurveyController` or `AdminController`
4. Update `Frontend/src/lib/api.ts` with TypeScript interface and API method
5. CORS is already configured globally

### Adding a New Frontend Page
1. Create directory in `Frontend/src/app/`
2. Add `page.tsx` (server/client component as needed)
3. Optional: Add to navigation in `Sidebar.tsx`
4. Use `trajectoryAPI` or `adminAPI` from `lib/api.ts`

### Processing New Dataset
1. Update `dataDir`, `sceneId`, `date`, `fps` in `Dataset/export_data.py`
2. Run `python export_data.py` to generate `trajectory_data.json`
3. Restart backend to load new data (due to `create-drop` mode)

### Changing Admin Password
1. Hash password: `GET http://localhost:8080/api/util/hash-password?password=newpassword`
2. Update `admin.default.password` in `application.properties`
3. Restart backend

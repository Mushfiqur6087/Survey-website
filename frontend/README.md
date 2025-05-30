# Survey Website Frontend

A Next.js-based frontend for the Trajectory Data Analysis and Knot Annotation Survey System. This application provides an interactive interface for annotating trajectory data and an administrative panel for managing annotations.

## 🚀 Features

### Survey Interface
- **Interactive Knot Placement**: Click-to-place knots on trajectory curves using Recharts LineChart
- **Real-time Visualization**: Dynamic trajectory rendering with coordinate scaling and transformation
- **Session Management**: Automatic session tracking for annotation workflows
- **Responsive Design**: Modern UI with TailwindCSS styling

### Admin Panel
- **Secure Authentication**: Login system for administrative access
- **Dashboard Overview**: Statistics and summaries of annotation sessions
- **Track Management**: Browse and analyze individual trajectory tracks
- **Advanced Visualizations**: Canvas-based rendering with trajectory-ordered path connections
- **Annotation Review**: View and manage knot annotations by session and track ID

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Data Visualization**: Recharts, Canvas API
- **HTTP Client**: Fetch API with custom utilities
- **Build Tool**: Next.js built-in bundler

## 📁 Project Structure

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel routes
│   │   ├── dashboard/     # Admin dashboard
│   │   └── tracks/        # Track management
│   │       └── [trackId]/ # Individual track details
│   ├── placeknots/        # Interactive survey interface
│   └── knot-comparison/   # Annotation comparison tools
├── lib/
│   └── api.ts            # API utilities and endpoints
└── globals.css           # Global styles and TailwindCSS
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend server running on http://localhost:8080

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Setup
The frontend automatically connects to the backend at `http://localhost:8080`. To change this, update the API base URL in `src/lib/api.ts`.

## 🔗 API Integration

The frontend communicates with the Spring Boot backend through RESTful APIs:

### Trajectory Data
- Fetches trajectory data for visualization
- Retrieves specific track information
- Handles coordinate transformation for display

### Knot Annotations
- Submits user-placed knot annotations
- Retrieves annotations by session and track ID
- Manages annotation sessions

### Admin Operations
- Handles admin authentication
- Fetches dashboard statistics
- Manages track data for admin panel

## 🎨 User Interface

### Survey Interface (`/placeknots`)
- Interactive trajectory curve visualization using Recharts
- Click-to-place knot functionality with real-time feedback
- Automatic coordinate transformation from display to scene coordinates
- Session-based annotation workflow

### Admin Panel (`/admin`)
- Secure login interface
- Dashboard with annotation statistics
- Track browser with advanced filtering
- Detailed track visualization with canvas-based rendering

## 🧪 Development

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting

### Key Components
- **TrajectoryChart**: Recharts-based interactive visualization
- **CanvasRenderer**: Advanced trajectory visualization with path connections
- **AdminDashboard**: Statistics and management interface
- **TrackDetailView**: Individual track analysis and visualization

## 🔧 Configuration

### API Configuration
Update `src/lib/api.ts` to modify backend connection settings:
```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

### Styling Configuration
TailwindCSS configuration is in `tailwind.config.js` with custom design tokens for the survey interface.

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop browsers (primary use case)
- Tablet devices
- Mobile devices (limited functionality for complex visualizations)

## 🐛 Troubleshooting

### Common Issues
1. **API Connection Errors**: Ensure backend is running on port 8080
2. **Chart Rendering Issues**: Check browser console for JavaScript errors
3. **Authentication Problems**: Verify admin credentials with backend
4. **Performance Issues**: Consider reducing trajectory data density for large datasets

## 🔮 Future Enhancements

- Real-time collaboration features
- Enhanced data export capabilities
- Advanced filtering and search functionality
- Mobile-optimized survey interface

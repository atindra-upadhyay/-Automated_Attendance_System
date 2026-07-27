# E-Attend - Electronic Attendance System

A modern web-based attendance management system with QR code integration and geolocation tracking.

## Features

- **Teacher Dashboard**: Generate QR tokens for attendance marking
- **Student Dashboard**: Scan QR tokens to mark attendance with geolocation
- **Real-time Tracking**: View attendance records in real-time
- **Data Export**: Export attendance data to CSV for analysis
- **Responsive Design**: Modern UI with Tailwind CSS

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend-ready
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   - Create a MySQL database named `e_attend_db`
   - Run the SQL schema from `models.sql`
   - Or run the seed script: `npm run seed`

4. Create a `.env` file in `backend-ready/` with:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=e_attend_db
   JWT_SECRET=your-super-secret-jwt-key
   PORT=4000
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend-ready
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:3000`

## Demo Accounts

- **Teacher**: `teacher@demo.com` / `1234`
- **Student**: `student@demo.com` / `1234`

## How to Use

1. **Login** with demo credentials
2. **Teacher**: Generate QR tokens for students to scan
3. **Student**: Copy the QR token from teacher and paste it in the scan form
4. **Location**: Allow geolocation when prompted
5. **View Records**: Check attendance history in both dashboards

## Technology Stack

- **Frontend**: React, React Router, Tailwind CSS
- **Backend**: Node.js, Express.js, MySQL
- **Authentication**: JWT tokens
- **Database**: MySQL with connection pooling
- **Additional**: QR code generation, geolocation API, CSV export

## Project Structure

```
e_attend/
├── backend-ready/
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── models.sql       # Database schema
│   └── server.js        # Main server file
├── frontend-ready/
│   ├── src/
│   │   ├── components/  # React components
│   │   └── utils/       # Frontend utilities
│   └── public/          # Static assets
└── README.md
```

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/qr/generate` - Generate QR token (Teacher only)
- `POST /api/attendance/mark` - Mark attendance (Student only)
- `GET /api/attendance/summary/:teacherId` - Get attendance summary
- `GET /api/attendance/student/:studentId` - Get student attendance history
- `GET /api/reports/export/:teacherId` - Export CSV data

## Troubleshooting

1. **Database Connection Issues**: Check your MySQL credentials in the `.env` file
2. **CORS Errors**: Ensure the backend is running on port 4000
3. **Geolocation Issues**: Make sure to allow location access in your browser
4. **QR Token Expired**: Generate a new token if the current one has expired

## Development

- Backend runs on `http://localhost:4000`
- Frontend runs on `http://localhost:3000`
- Database should be accessible on `localhost:3306` (default MySQL port)

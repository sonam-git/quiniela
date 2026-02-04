# Quiniela - Soccer Betting App ⚽

A MERN stack application for friendly soccer betting among friends.

## Features

- 🔐 **User Authentication** - Secure signup/login with JWT
- 📊 **Dynamic Dashboard** - View all bets in a beautiful 13-column table
- 🎯 **Betting System** - Place predictions for 9 weekly matches
- ⏰ **Lockout Protection** - Betting closes 5 minutes before first match
- 🏆 **Winner Calculation** - Automatic scoring with tie-breaker logic
- 💰 **Payment Tracking** - Track who has paid their entry fee
- ⚡ **Real-Time Updates** - Instant updates via Socket.io when admin makes changes
- 📅 **Automatic Scheduling** - Weekly schedules created automatically

## Tech Stack

- **Frontend**: React, Tailwind CSS, React Router, Socket.io-client
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Real-Time**: Socket.io (works with Render)

## Project Structure

```
Quiniela/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Bet.js
│   │   └── Schedule.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bets.js
│   │   ├── schedule.js
│   │   └── results.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── seed.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd Quiniela
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   
   Edit `backend/.env`:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/quiniela
   JWT_SECRET=your_super_secret_key_here
   ```

4. **Seed the Database** (Optional - adds demo data)
   ```bash
   npm run seed
   # or
   node seed.js
   ```
   ⚠️ **Warning**: This clears ALL existing data (users, bets, schedules)

5. **Create Schedule Only** (Preserves users and bets)
   ```bash
   # Create schedule for current jornada
   npm run schedule
   
   # Create schedule for specific jornada (e.g., Jornada 6)
   node createSchedule.js 6
   
   # Force replace existing schedule
   node createSchedule.js 6 --force
   ```

6. **Start Backend Server**
   ```bash
   npm run dev
   ```

6. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```

7. **Open the App**
   
   Visit [http://localhost:3000](http://localhost:3000)

## Automatic Weekly Scheduling

The system includes an automatic scheduler that:

1. **Creates Next Week's Schedule** - Every Sunday at midnight (Pacific Time), the system automatically creates the schedule for the upcoming Liga MX jornada.

2. **Cleans Up Old Data** - Automatically removes schedules and bets older than "last week" to keep the database clean. Only current week and last week data are retained.

3. **Dashboard Last Week Tab** - The dashboard displays a "Last Week" tab (when data exists) showing the final results from the previous week. This tab automatically disappears when the next week ends.

**Manual Schedule Management:**
```bash
# Create schedule for current/next jornada
npm run schedule

# Create schedule for specific jornada (e.g., Jornada 6)
node createSchedule.js 6

# Force replace existing schedule
node createSchedule.js 6 --force
```

## Demo Credentials

After seeding the database:
- **Email**: carlos@example.com
- **Password**: password123

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get JWT
- `GET /api/auth/me` - Get current user

### Schedule
- `GET /api/schedule/current` - Get current week's schedule
- `GET /api/schedule/last-week` - Get last week's schedule (for historical view)
- `GET /api/schedule/:weekNumber/:year` - Get specific week's schedule
- `POST /api/schedule` - Create new schedule (admin)

### Bets
- `GET /api/bets/current` - Get all bets for current week
- `GET /api/bets/last-week` - Get all bets from last week (for historical view)
- `GET /api/bets/my/current` - Get user's bet for current week
- `POST /api/bets` - Place or update bet
- `PATCH /api/bets/:betId/paid` - Update paid status

### Results
- `POST /api/results/update-match` - Update match result
- `POST /api/results/settle` - Settle weekly results and calculate points

## Scoring System

1. **Points**: 1 point for each correct match prediction (max 9)
2. **Tie-breaker**: If points are equal, closest goal prediction wins
3. **Winner**: Highlighted with gold background and crown icon

## Betting Rules

- Users must predict all 9 matches
- Users must predict total goals for the week
- Betting locks 5 minutes before the first match
- After lockout, no edits are allowed

## License

MIT

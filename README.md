# Quiniela - Soccer Betting App ⚽

A MERN stack application for friendly soccer betting among friends.

## Features

- 🔐 **User Authentication** - Secure signup/login with JWT
- 📊 **Dynamic Dashboard** - View all bets in a beautiful 13-column table
- 🎯 **Betting System** - Place predictions for 9 weekly matches
- ⏰ **Lockout Protection** - Betting closes 5 minutes before first match
- 🏆 **Winner Calculation** - Automatic scoring with tie-breaker logic
- 💰 **Payment Tracking** - Track who has paid their entry fee

## Tech Stack

- **Frontend**: React, Tailwind CSS, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT

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

5. **Start Backend Server**
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
- `GET /api/schedule/:weekNumber/:year` - Get specific week's schedule
- `POST /api/schedule` - Create new schedule (admin)

### Bets
- `GET /api/bets/current` - Get all bets for current week
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

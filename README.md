# Connect Four - Online Multiplayer

A real-time multiplayer Connect Four game where two players can connect and play together online, or challenge an AI opponent locally.

## Features

- **Online Multiplayer** -- Create or join a game room via a 6-character game code and play against a friend in real-time using WebSockets
- **Play vs Computer** -- Challenge an AI opponent with three difficulty levels:
  - **Easy** -- Random moves
  - **Medium** -- Minimax AI (depth 3) with occasional random moves
  - **Hard** -- Full minimax with alpha-beta pruning (depth 6)
- **30-Second Turn Timer** -- Enforced both client-side and server-side; a random move is made automatically if time runs out
- **Live Opponent Cursor** -- See your opponent's mouse position on the board in real-time
- **Sound Effects** -- Audio feedback for piece drops, wins, losses, and draws
- **Column Hover Preview** -- See where your piece will land before clicking
- **Win Highlighting** -- Winning four cells glow and pulse on game end
- **Responsive Design** -- Works on desktop and mobile screens

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, Vite, Tailwind CSS      |
| Backend  | Node.js, Express, Socket.IO       |
| AI       | Minimax with alpha-beta pruning   |

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

## Getting Started

### Local Development

**1. Clone the repository**

```bash
git clone https://github.com/vkroy11/Connect-4.git
cd Connect-4
```

**2. Start the backend**

```bash
cd Backend/connect-four/server
npm install
npm run dev
```

The backend server starts on http://localhost:3001.

**3. Start the frontend** (in a new terminal)

```bash
cd Frontend/connect-four
npm install
npm run dev
```

The frontend starts on http://localhost:5173.

**4. Open the game**

Open http://localhost:5173 in your browser. To play multiplayer, open a second browser tab/window.

### Docker Deployment

```bash
docker compose up --build
```

The app will be available at http://localhost:80. The frontend nginx container proxies WebSocket connections to the backend automatically.

## Project Structure

```
Connect-4/
├── Backend/connect-four/server/
│   ├── src/
│   │   ├── server.js            # Socket.IO server & event handlers
│   │   ├── config/config.js     # Environment configuration
│   │   ├── models/Game.js       # Game state & logic
│   │   └── utils/gameUtils.js   # Win detection, move validation
│   ├── Dockerfile
│   └── package.json
├── Frontend/connect-four/
│   ├── src/
│   │   ├── App.jsx              # Root component & routing
│   │   ├── contexts/
│   │   │   ├── GameContext.jsx       # Online multiplayer state
│   │   │   └── LocalGameContext.jsx  # vs Computer state
│   │   ├── components/
│   │   │   ├── GameBoard.jsx         # Online game board
│   │   │   ├── LocalGameBoard.jsx    # Computer game board
│   │   │   ├── GameLobby.jsx         # Lobby & matchmaking
│   │   │   ├── DifficultySelector.jsx
│   │   │   ├── Timer.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── Spinner.jsx
│   │   ├── engine/
│   │   │   ├── aiEngine.js      # Minimax AI with alpha-beta pruning
│   │   │   └── gameLogic.js     # Shared game logic (pure functions)
│   │   └── utils/
│   │       └── sounds.js        # Web Audio API sound effects
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## How to Play

1. Enter your name in the lobby
2. **Online**: Click "Create New Game" and share the game code, or enter a code and click "Join Game"
3. **vs Computer**: Click "Play vs Computer", choose a difficulty, and start playing
4. Click a column to drop your piece -- connect four in a row (horizontally, vertically, or diagonally) to win

## Environment Variables

**Backend** (`Backend/connect-four/server/.env`):

| Variable      | Default                   | Description              |
|---------------|---------------------------|--------------------------|
| `PORT`        | `3001`                    | Server port              |
| `CORS_ORIGIN` | `http://localhost:5173`   | Allowed CORS origin      |

**Frontend** (`Frontend/connect-four/.env`):

| Variable          | Default                 | Description        |
|-------------------|-------------------------|--------------------|
| `VITE_SOCKET_URL` | `http://localhost:3001`  | Backend server URL |

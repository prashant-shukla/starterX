# starterX

A clean, production-ready boilerplate with NestJS backend and React/Vite frontend.

## Stack Overview

- **Frontend**: `web/` (Vite + React + TypeScript)
- **Backend**: `api/` (NestJS + TypeScript)
- **Database**: PostgreSQL
- **API Docs**: Swagger at `http://localhost:<api-port>/api-docs`

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL (or use Supabase/other hosted Postgres)
- npm or yarn

### Option 1: Web Installer (Recommended)

The easiest way to set up the application is using the built-in web installer:

1. **Start the backend:**
   ```bash
   cd api
   npm install
   
   # Create .env file
   cp .env.example .env
   
   # Edit .env with your database credentials
   # DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   # JWT_SECRET=your-secret-key
   
   npm run start:dev
   ```

2. **Start the frontend:**
   ```bash
   cd web
   npm install
   npm run dev
   ```

3. **Open the installer:**
   - Navigate to `http://localhost:3000/setup`
   - The installer will guide you through:
     - Testing database connection
     - Running database migrations
     - Creating your admin user
   - Once complete, you'll be redirected to the login page

### Option 2: Manual Setup

#### 1. Backend Setup

```bash
cd api
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname
# JWT_SECRET=your-secret-key

# Run migrations
npm run migrate

# Create demo user (optional)
npm run create-demo-user

# Start dev server
npm run start:dev
```

The API will start on port 4000 (or next available port). The port is written to `web/.api_port` for frontend discovery.

#### 2. Frontend Setup

```bash
cd web
npm install
npm run dev
```

Open the app at `http://localhost:3000` (default Vite port).

## Environment Configuration

### Backend (`api/.env`)

```ini
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/dbname

# JWT Authentication
JWT_SECRET=your-secret-key-here

# Optional
PORT=4000
QUIET_LOGS=false
```

### Database Connection String

**Important:** If your password contains special characters (like `@`, `#`, `%`, `:`, `/`, etc.), you must URL-encode them in the connection string.

**Common special character encodings:**
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `&` → `%26`
- `=` → `%3D`
- `+` → `%2B`
- ` ` (space) → `%20` or `+`

**Examples:**

```bash
# Password: "myp@ss#word"
DATABASE_URL=postgresql://postgres:myp%40ss%23word@localhost:5432/dbname

# Password: "p@ssw:rd"
DATABASE_URL=postgresql://postgres:p%40ssw%3Ard@localhost:5432/dbname

# Password: "pass word" (with space)
DATABASE_URL=postgresql://postgres:pass%20word@localhost:5432/dbname
```

**Quick encoding helper:** You can use Node.js to encode your password:
```bash
node -e "console.log(encodeURIComponent('your-password-here'))"
```

Or use an online URL encoder tool.

### Frontend

The frontend automatically reads the API port from `web/.api_port` (created by the backend).

## Project Structure

```
.
├── api/                    # NestJS backend
│   ├── src/
│   │   ├── auth/          # Authentication controllers
│   │   ├── health/         # Health check endpoint
│   │   ├── shared/         # Shared utilities (db, middleware, guards)
│   │   ├── app.module.ts   # Main app module
│   │   └── main.ts         # Entry point
│   ├── migrations/         # Database migrations
│   ├── scripts/            # Utility scripts
│   └── uploads/            # File uploads directory
│
└── web/                    # React frontend
    ├── src/
    │   ├── components/     # React components
    │   ├── pages/          # Page components
    │   ├── utils/          # Utilities (API client, auth)
    │   └── AppRouter.tsx   # Main router
    └── public/             # Static assets
```

## Available Scripts

### Backend (`api/`)

- `npm run start:dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run create-demo-user` - Create demo user (email: demo@example.com, password: demo123)
- `npm test` - Run tests

### Frontend (`web/`)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run vercel-build` - Build for Vercel deployment

## Demo User

After running migrations, create a demo user:

```bash
cd api
npm run create-demo-user
```

**Demo Credentials:**
- Email: `demo@example.com`
- Password: `demo123`

You can use these credentials to login and explore the dashboard.

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/setup-admin` - Create admin user (bootstrap)

### Users

- `GET /users` - List users (protected)
- `POST /users` - Create user (protected)

### Setup/Installer

- `GET /setup/status` - Get installation status
- `GET /setup/test-database` - Test database connection
- `POST /setup/run-migrations` - Run database migrations
- `POST /setup/create-admin` - Create admin user

### Health

- `GET /` - Health check

## Database Migrations

Migrations are in `api/migrations/`. Run them with:

```bash
cd api
npm run migrate
```

## Development Tips

1. **API Port Discovery**: The backend writes its port to `web/.api_port` so the frontend can discover it automatically.

2. **CORS**: Enabled for local development. Configure in `api/src/main.ts` for production.

3. **JWT Tokens**: Tokens expire after 8 hours. The frontend automatically handles token refresh.

4. **Swagger Docs**: Visit `http://localhost:4000/api-docs` when the API is running.

5. **Web Installer**: Visit `http://localhost:3000/setup` to use the interactive installer for easy setup.

## Recommended Features

See [FEATURES.md](./FEATURES.md) for a comprehensive list of recommended features to add to make this starter template even more useful. This includes:

- Email verification and password reset
- Role-based access control (RBAC)
- File upload enhancements
- Testing setup
- Docker support
- And much more!

## Deployment

### Backend

The backend can be deployed to any Node.js hosting (Vercel, Railway, Render, etc.).

### Frontend

The frontend can be deployed to Vercel, Netlify, or any static hosting.

## License

MIT

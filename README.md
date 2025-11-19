# DigitalizaciónTV

Sistema de señalización digital para gestión de pantallas remotas y distribución de contenido multimedia.

## Stack

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Deploy**: Docker Compose

## Setup Rápido

### Opción 1: Con Docker (Completo)

```bash
docker-compose up -d
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **PgAdmin**: http://localhost:8081

### Opción 2: Desarrollo Local

#### 1. Base de datos (solo DB en Docker)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### 2. Backend

```bash
cd backend
cp .env.example .env  # Ajustar DATABASE_URL si es necesario
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev  # Puerto 5000
```

#### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev  # Puerto 5173
```

## Credenciales por Defecto

- **Admin**: admin@digitalizacion.com / admin123
- **Manager**: gestor@digitalizacion.com / gestor123

## Estructura

```
├── backend/
│   ├── src/
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── routes/         # Rutas API
│   │   ├── middleware/     # Auth, etc.
│   │   ├── utils/          # Helpers
│   │   ├── lib/            # Prisma singleton
│   │   └── types/          # TypeScript types
│   └── prisma/
│       └── schema.prisma   # Modelo de datos
├── frontend/
│   └── src/
│       ├── pages/          # Vistas
│       ├── components/     # Componentes UI
│       ├── contexts/       # Context API
│       └── services/       # API client
└── docker-compose.yml      # Producción
└── docker-compose.dev.yml  # Solo DB
```

## Comandos Útiles

```bash
# Backend
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm run seed         # Poblar DB con datos iniciales
npx prisma studio    # UI para ver/editar DB
npx prisma migrate dev --name <nombre>  # Nueva migración

# Frontend
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview del build
```

## API Endpoints

- `POST /api/auth/login` - Autenticación
- `GET /api/screens` - Listar pantallas
- `GET /api/content` - Listar contenido
- `GET /api/areas` - Listar áreas
- `GET /api/users` - Listar usuarios (ADMIN)
- `GET /player/:code` - Vista pública del player

## Notas

- Las pantallas envían heartbeat cada 30s
- Pantallas offline si no hay heartbeat en 5 min
- JWT expira en 7 días
- Player es público (sin auth)

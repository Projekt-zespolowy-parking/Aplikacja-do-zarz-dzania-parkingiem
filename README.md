# Parking Management App

Aplikacja webowa do zarządzania parkingiem tworzona w ramach przedmiotu Zaawansowany Projekt Zespołowy.

## Technologie

- Node.js
- Express
- Prisma
- SQLite

## Uruchomienie backendu

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

API działa pod adresem:

```txt
http://localhost:5000
```

## Endpointy

```txt
GET /                  - test API
GET /api/spots         - lista miejsc parkingowych
POST /api/spots        - dodanie miejsca parkingowego
PATCH /api/spots/:id/status - zmiana statusu miejsca
GET /api/reservations  - lista rezerwacji
POST /api/reservations - utworzenie rezerwacji
```

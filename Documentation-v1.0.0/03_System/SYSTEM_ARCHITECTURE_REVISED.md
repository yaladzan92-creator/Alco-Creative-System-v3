# SYSTEM_ARCHITECTURE.md

# Tujuan
Dokumen ini menjadi acuan arsitektur teknis Alco Creative System.

## Arsitektur Tingkat Tinggi

Client (React + TypeScript + Vite)
        |
        v
Backend API (Express)
        |
        +--> Gemini API (User API Key)
        |
        +--> Firebase Authentication
        |
        +--> Firestore Database

## Frontend
- React
- TypeScript
- Vite
- Component-based Architecture

## Backend
- Express
- REST API
- Authentication Middleware
- AI Service
- Brand Intelligence

## Storage
- Firestore
- Local Storage (session & preferences)

## Modul Utama
1. Authentication
2. Project Management
3. Workflow Engine
4. Brand Intelligence
5. AI Generator
6. Export Engine

## Shared Business Context

Product
Audience
Pain Point
Positioning
Offer
Marketing Angle
Brand Foundation

Semua generator membaca konteks yang sama.

## AI Flow

Workflow
↓
Business Context
↓
Prompt Builder
↓
Gemini
↓
Structured JSON
↓
Validation
↓
Project Storage

## Security
- Firebase Authentication
- User-owned Gemini API Key
- Ownership Validation
- Environment Separation (Development / Production)

## Future Architecture
- White Label
- Multi Workspace
- Team Collaboration
- Analytics
- External API

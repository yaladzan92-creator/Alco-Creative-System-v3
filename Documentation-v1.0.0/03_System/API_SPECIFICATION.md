# API_SPECIFICATION

## Authentication
POST /auth/login
POST /auth/logout

## Projects
GET /projects
POST /projects
GET /projects/{id}
PUT /projects/{id}
DELETE /projects/{id}

## AI
POST /ai/generate
POST /ai/regenerate

## Export
POST /export/zip

Semua endpoint memerlukan autentikasi kecuali login.

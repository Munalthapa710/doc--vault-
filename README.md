# Personal Document Vault

Secure personal document vault for uploading, previewing, downloading, searching, deleting, restoring, and permanently deleting private documents.

## Tech Stack

- Backend: ASP.NET Core Web API, C#, MongoDB Atlas, JWT auth, refresh tokens
- Storage: Cloudinary
- Email OTP: Brevo
- OAuth: Google Login
- Frontend: React, TypeScript, Vite, PWA
- Deploy: Render for backend, Vercel for frontend

## Project Structure

```text
PersonalVault/
├── PersonalVault.Api/
│   ├── Api/v1/                 API controllers
│   ├── Common/                 Response wrappers and shared results
│   ├── Configurations/         Strongly typed app settings
│   ├── Data/                   MongoDB context and indexes
│   ├── Helpers/                Security, file, password helpers
│   ├── Middleware/             Global exception and security middleware
│   ├── Model/                  MongoDB entity models
│   ├── Service/                Auth, token, OTP, document, Cloudinary, Brevo services
│   ├── ViewModel/              Request and response DTOs
│   ├── Program.cs              API startup pipeline
│   └── PersonalVault.Api.csproj
├── client/
│   ├── public/                 PWA manifest, service worker, vault logo
│   ├── src/
│   │   ├── components/         Shared UI components
│   │   ├── pages/              Login, dashboard, vault, upload, settings pages
│   │   ├── api.ts              Axios API client and API wrappers
│   │   ├── store.ts            Auth/session state
│   │   ├── theme.ts            Appearance settings
│   │   └── navigation.tsx      Sidebar/mobile navigation
│   ├── package.json
│   └── vercel.json
├── Dockerfile                  Render backend Docker build
└── PersonalVault.sln
```

## Required Environment Variables

Backend:

```env
ASPNETCORE_ENVIRONMENT=Production
MongoDb__ConnectionString=
MongoDb__DatabaseName=
Jwt__Key=
Jwt__Issuer=PersonalVault
Jwt__Audience=PersonalVaultClient
Jwt__AccessTokenMinutes=15
Jwt__RefreshTokenDays=180
Cloudinary__CloudName=
Cloudinary__ApiKey=
Cloudinary__ApiSecret=
Cloudinary__Folder=personal-vault
Brevo__ApiKey=
Brevo__SenderEmail=
Brevo__SenderName=
GoogleAuth__ClientId=
GoogleAuth__ClientSecret=
Security__AllowedCorsOrigins__0=
Security__EnableEmailOtpLogin=true
Security__MaxFileSizeBytes=26214400
Security__MaxLoginAttempts=5
Security__MaxOtpAttempts=5
Security__OtpExpiryMinutes=5
Security__ResendOtpCooldownSeconds=60
```

Frontend:

```env
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
```

Do not commit real secrets. Put production values only in Render/Vercel environment settings.

## Run Locally

Backend:

```powershell
cd PersonalVault.Api
dotnet restore
dotnet run
```

Frontend:

```powershell
cd client
npm install
npm run dev
```

Production builds:

```powershell
dotnet build PersonalVault.sln
cd client
npm run build
```

## Security Notes

- Passwords, OTPs, and refresh tokens are hashed before storage.
- Access tokens are short-lived.
- Refresh tokens rotate and last 180 days by configuration.
- Document preview/download requests go through the backend ownership check.
- PWA caches static assets only, not private files or authenticated API responses.
- Deleted files are soft-deleted first and can be restored from Restore Deleted.
- Permanent delete removes the document record and Cloudinary file.

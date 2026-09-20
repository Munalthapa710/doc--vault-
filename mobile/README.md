# Personal Vault Mobile

React Native mobile app for the Personal Vault backend, built with Expo and reusable components inspired by `C:\Users\hp\usefulstuff\mob-component`.

## Run

```powershell
cd mobile
npm install
npm run start
```

Set the API URL when needed:

```powershell
$env:EXPO_PUBLIC_API_URL="http://YOUR_API_HOST:5000/api"
npm run start
```

Android emulator default is `http://10.0.2.2:5000/api`; iOS/web default is `http://localhost:5000/api`.

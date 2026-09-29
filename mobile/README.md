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

The app uses the local Expo development host on port 5000 when available. Otherwise, Android defaults to `http://10.0.2.2:5000/api` and iOS/web currently fall back to `http://192.168.1.71:5000/api`. Set `EXPO_PUBLIC_API_URL` explicitly if the backend uses another address, then restart Expo with `npm run start -- --clear`.

## iPhone connection troubleshooting

Expo serves the mobile app; it does not start the backend. The backend must be running and listening on a network-accessible address (not only `localhost`). On a physical iPhone, `localhost` refers to the phone itself.

For local development, connect the phone and computer to the same Wi-Fi, allow Local Network access for Expo Go (or the installed app) in iPhone Settings, and allow the backend port through the computer's firewall. An Expo tunnel only exposes Metro, not the backend API.

Check the configured backend port on the computer:

```powershell
Test-NetConnection -ComputerName 192.168.1.71 -Port 5000
```

If this fails, start the backend or correct its address/port before retrying sign-in. Increasing the mobile request timeout will not make an unavailable backend reachable.

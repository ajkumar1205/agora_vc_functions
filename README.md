# Agora Video Call Firebase Functions

This repository contains Firebase Cloud Functions that handle token generation for Agora.io video calls and manage call notifications using Firebase Cloud Messaging (FCM).

## Functions Overview

### 1. `generateAgoraToken`

A callable Firebase function that generates a token for Agora.io video calls.

**Function Type**: HTTP Callable (Firebase Functions v2)

**Authentication**: Required

**Input Parameters**:
```typescript
{
    channelName: string  // The name of the video call channel
}
```

**Response**:
```typescript
{
    token: string  // The generated Agora token
}
```

**Error Cases**:
- Unauthenticated: When the function is called without authentication
- Invalid Argument: When channelName is not provided
- Internal Error: When token generation fails

**Technical Details**:
- Uses `agora-token` library for token generation
- Token is generated with PUBLISHER role
- Token expires after 1 hour (3600 seconds)
- Uses Firebase UID as the Agora UID

### 2. `sendCallNotification`

A Firestore trigger function that sends FCM notifications when a new call document is created.

**Function Type**: Firestore Document Created Trigger (Firebase Functions v2)

**Trigger Path**: `calls/{callId}`

**Expected Document Structure**:
```typescript
{
    callerId: string,     // UID of the user initiating the call
    receiverId: string,   // UID of the user receiving the call
    channelName: string   // The Agora channel name for the call
}
```

**Required Firestore Structure**:
- Collection: `users`
  - Document fields:
    - `displayName`: string
    - `fcmToken`: string

**Notification Payload**:
```typescript
{
    notification: {
        title: string,    // "Incoming Call from {callerName}"
        body: string      // "Tap to answer."
    },
    data: {
        channelName: string,  // The Agora channel name
        caller: string        // Stringified caller data
    }
}
```

## Setup and Configuration

### Prerequisites
- Node.js v22 (as specified in package.json)
- Firebase CLI
- Firebase project with Firestore and Cloud Messaging enabled

### Environment Variables
The following constants need to be configured:
```typescript
const APP_ID: string = "your_agora_app_id";
const APP_CERTIFICATE: string = "your_agora_app_certificate";
```

For production, it's recommended to use Firebase Environment Configuration:
```bash
firebase functions:config:set agora.app_id="YOUR_APP_ID" agora.app_certificate="YOUR_APP_CERTIFICATE"
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Deploy the functions:
```bash
npm run deploy
```

### Local Development

1. Start the Firebase emulator:
```bash
npm run serve
```

2. Watch for changes and rebuild:
```bash
npm run build:watch
```

## Dependencies

- `firebase-admin`: ^12.7.0
- `firebase-functions`: ^6.3.2
- `agora-token`: ^2.0.5

## Error Handling

Both functions include comprehensive error handling:
- All errors are logged to Firebase Functions logs
- Client-facing errors are properly formatted
- Type checking is enforced throughout the codebase

## Security

- Authentication is required for token generation
- FCM tokens and user data are securely stored in Firestore
- Agora credentials are kept secure and not exposed to clients

## Best Practices

- Uses TypeScript for type safety
- Implements Firebase Functions v2 for better performance
- Properly handles async/await operations
- Includes proper error logging
- Uses strong typing for all data structures

# Quick Relay WebSocket Signaling Service

This service provides a lightweight WebSocket-based signaling mechanism for establishing WebRTC peer-to-peer connections between two clients. The signaling service handles the initial connection, session pairing, and the relay of WebRTC signaling messages (such as SDP offers/answers and ICE candidates).

## How It Works

1. **Connection Establishment ($connect):**  
   When a client connects to the WebSocket endpoint, the API Gateway triggers the `$connect` route. This route is used solely to establish the connection and returns a 200 status code. No session logic is performed at this stage.

2. **Session Pairing ("init" Route):**  
   - **Session Creation:**  
     If the first client sends an `init` message without a `sessionCode`, the service creates a new session. It generates a random 6-digit session code, stores a new session record in a DynamoDB table (including the connection ID, creation time, and an expiration time via TTL), and sends the session code back to the client.
   - **Session Joining:**  
     When a second client sends an `init` message with a `sessionCode`, the service looks up the session in DynamoDB. If the session exists and has fewer than 2 connections, it adds the new connection to the session. If the session is already full (i.e., already has 2 clients) or not found, an appropriate error message is returned.

3. **Signaling ("signal" Route):**  
   Once two clients are paired in a session, they exchange WebRTC signaling messages (SDP offers/answers and ICE candidates) via the `signal` route. The service retrieves the session record, then relays the incoming signaling message to the other connection(s) in the session—excluding the sender.

4. **Disconnection ($disconnect):**  
   When a client disconnects (e.g., by closing the WebSocket connection), the `$disconnect` route is triggered. The service currently logs the disconnection. Session cleanup is handled by DynamoDB TTL, which automatically removes stale sessions.

## Mermaid Diagram

Below is the mermaid diagram that visually represents the signaling protocol:

```mermaid
sequenceDiagram
    autonumber
    participant C1 as Client 1
    participant S as Signaling Service (Lambda)
    participant C2 as Client 2

    %% Connection Establishment
    C1->>S: $connect
    S-->>C1: (Connection established)
    note over C1: Client 1 is now connected.

    %% Session Creation
    C1->>S: init {"action": "init"}
    S-->>C1: {"message": "Session created", "sessionCode": "123456"}
    note over C1: Display session code (e.g., via QR)

    %% Connection Establishment for Client 2
    C2->>S: $connect
    S-->>C2: (Connection established)
    note over C2: Client 2 is now connected.

    %% Session Joining
    C2->>S: init {"action": "init", "sessionCode": "123456"}
    alt Session exists and not full
        S-->>C2: {"message": "Joined session", "sessionCode": "123456"}
    else Session full or not found
        S-->>C2: {"error": "Session is full" or "Session not found"}
    end
    note over C1,C2: Both clients are now in session "123456".

    %% WebRTC Signaling Phase
    C1->>S: signal {"action": "signal", "sessionCode": "123456", "type": "offer", "sdp": "<SDP offer>"}
    S-->>C2: Relay {"action": "signal", "sessionCode": "123456", "type": "offer", "sdp": "<SDP offer>"}
    C2->>S: signal {"action": "signal", "sessionCode": "123456", "type": "answer", "sdp": "<SDP answer>"}
    S-->>C1: Relay {"action": "signal", "sessionCode": "123456", "type": "answer", "sdp": "<SDP answer>"}
    C1->>S: signal {"action": "signal", "sessionCode": "123456", "type": "ice", "candidate": "<ICE candidate 1>"}
    S-->>C2: Relay {"action": "signal", "sessionCode": "123456", "type": "ice", "candidate": "<ICE candidate 1>"}
    C2->>S: signal {"action": "signal", "sessionCode": "123456", "type": "ice", "candidate": "<ICE candidate 2>"}
    S-->>C1: Relay {"action": "signal", "sessionCode": "123456", "type": "ice", "candidate": "<ICE candidate 2>"}
    note over C1,C2: WebRTC negotiation complete—direct peer-to-peer connection established.

    %% (Optional) File Transfer Phase
    note over C1: Client 1 sends file data via RTC Data Channel.
    note over C2: Client 2 receives file data.

    %% Disconnection Phase
    C1->>S: $disconnect
    S-->>C1: (Connection closed)
    C2->>S: $disconnect
    S-->>C2: (Connection closed)
```
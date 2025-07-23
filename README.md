# Pourtle

**Instantly share files, photos, and more between your devices**

Pourtle is a peer-to-peer file sharing web application that enables direct, secure file transfers between devices without uploads, cloud storage, or user accounts. Simply visit [pourtle.com](https://pourtle.com), get a 6-digit session code, and start sharing.

## Features

- **Peer-to-Peer Transfer** - Files go directly between your devices, never touching our servers
- **Zero Installation** - Works in any modern browser on phones, tablets, and computers  
- **Private & Secure** - Your files never leave your devices during transfer
- **Cross-Platform** - Share between iOS, Android, Windows, Mac, and Linux
- **Simple UX** - Just a 6-digit code to connect devices
- **Multiple File Types** - Images, videos, PDFs, documents, and clipboard content
- **Live Preview** - View files before downloading
- **Real-time** - Instant transfer with progress tracking

## How It Works

1. **Device A** visits pourtle.com and gets a 6-digit session code
2. **Device B** enters that code on pourtle.com  
3. Devices connect directly using **WebRTC** technology
4. Share files, photos, text, or clipboard content instantly
5. Files transfer directly between devices (no cloud upload/download)

The connection works on the same network (WiFi) or across the internet through NAT traversal.

## Architecture

Pourtle consists of two main components:

### Web Application (`apps/web/`)
- **React 19** single-page application
- **Material-UI** for responsive design  
- **WebRTC** for peer-to-peer data channels
- Deployed to **AWS S3 + CloudFront** 
- Custom file chunking and transfer protocol
- Support for drag & drop, clipboard, and file previews

### Signaling Service (`services/signaling/`)
- **AWS Lambda + API Gateway** WebSocket service
- **DynamoDB** for temporary session storage
- Facilitates WebRTC handshake between devices
- Generates session codes and manages peer pairing
- Sessions auto-expire for privacy

```
┌─────────────┐    WebRTC Data Channel    ┌─────────────┐
│   Device A  │◄─────────────────────────►│   Device B  │
└─────────────┘                           └─────────────┘
       │                                         │
       │          AWS Signaling Service          │
       └─────────────┬─────────────┬─────────────┘
                     │             │
              ┌──────────────┐ ┌─────────┐
              │   Lambda +   │ │ DynamoDB│
              │ API Gateway  │ │Sessions │
              └──────────────┘ └─────────┘
```

## Development

### Prerequisites
- **Node.js 18+** and **Yarn** (for web app)
- **Python 3.10+** (for signaling service)  
- **AWS CLI** configured (for deployment)

### Running Locally

**Web Application:**
```bash
cd apps/web
yarn install
yarn start
# Visit http://localhost:3000
```

**Signaling Service:**
```bash
cd services/signaling  
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .
# Configure AWS credentials and deploy via CloudFormation
```

### Deployment

Both components include CloudFormation templates for one-click AWS deployment:

- **Web App**: `apps/web/cloudformation.yaml` → S3 + CloudFront + Custom Domain
- **Signaling Service**: `services/signaling/cloudformation.yaml` → Lambda + API Gateway + DynamoDB

## Technology Stack

**Frontend:**
- React 19, Material-UI, WebRTC APIs
- File chunking, drag & drop, clipboard integration
- React Context for state management
- Service workers for file handling

**Backend:**  
- AWS Lambda (Python), API Gateway WebSockets
- DynamoDB with TTL for session cleanup
- CloudFormation for infrastructure-as-code

**DevOps:**
- GitHub Actions for CI/CD
- CloudFront CDN for global distribution
- S3 static site hosting

## Why Pourtle?

Most file sharing solutions require:
- Uploading to cloud storage
- User accounts and sign-ins  
- App downloads and installations
- Trusting third parties with your data

Pourtle eliminates all of these by connecting your devices directly. Your files stay private, transfers are instant, and there's zero setup required.

## License

This project is licensed under the Creative Commons Attribution 4.0 International License (CC BY 4.0). See the [LICENSE.txt](LICENSE.txt) file for more information.

**Visit [pourtle.com](https://pourtle.com) to try it out!**
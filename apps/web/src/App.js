// src/App.js
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';

function App() {
  // Generate a GUID once on component mount
  const sessionId = React.useMemo(() => uuidv4(), []);
  // Construct the universal link URL that will trigger the iOS app via universal links
  const universalLinkUrl = `https://quick-relay.com/join?session=${sessionId}`;

  // Inline style objects
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem'
  };

  const headerStyle = {
    marginBottom: '2rem'
  };

  const sectionStyle = {
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const qrStyle = {
    width: 256,
    height: 256
  };

  const footerStyle = {
    marginTop: '1rem'
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1>Quick Relay</h1>
      </header>

      <section style={sectionStyle}>
        <p>
          To connect your iPhone, please scan the QR code below with your iPhone camera.
        </p>
        <p>
          This will launch the Quick Relay app and join your session.
        </p>
      </section>

      <section style={sectionStyle}>
        <QRCodeSVG value={universalLinkUrl} style={qrStyle} />
      </section>

      <footer style={footerStyle}>
        <p><strong>Session ID:</strong> {sessionId}</p>
        <p>
          Universal Link: <code>{universalLinkUrl}</code>
        </p>
      </footer>
    </div>
  );
}

export default App;
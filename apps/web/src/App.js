// src/App.js
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';

function App() {
  // Generate a GUID once on component mount
  const sessionId = React.useMemo(() => uuidv4(), []);
  // Construct the universal link URL that will trigger the iOS app via universal links
  const universalLinkUrl = `https://quick-relay.com/join?session=${sessionId}`;

  // State for copy confirmation
  const [copied, setCopied] = useState(false);

  // Inline style objects
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    fontFamily: 'Arial, sans-serif'
  };

  const headerStyle = {
    marginBottom: '2rem',
    fontSize: '2rem',
    fontWeight: 'bold'
  };

  const sectionStyle = {
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const qrContainerStyle = {
    padding: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    backgroundColor: '#fff'
  };

  const qrStyle = {
    width: 256,
    height: 256
  };

  const footerStyle = {
    marginTop: '1rem',
    fontSize: '0.9rem',
    color: '#555'
  };

  const buttonStyle = {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007acc',
    color: '#fff'
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(universalLinkUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Error copying text: ', err);
      });
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        Quick Relay
      </header>

      <section style={sectionStyle}>
        <p>
          To connect your iPhone, please scan the QR code below with your iPhone camera
          or copy the link.
        </p>
      </section>

      <section style={sectionStyle}>
        <div style={qrContainerStyle}>
          <QRCodeSVG value={universalLinkUrl} style={qrStyle} />
        </div>
      </section>

      <section style={sectionStyle}>
        <button style={buttonStyle} onClick={handleCopyLink}>
          Copy Universal Link
        </button>
        {copied && <p style={{ color: 'green' }}>Link copied!</p>}
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
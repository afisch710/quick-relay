// src/pages/HomePage.js
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSpring, useTrail, animated } from '@react-spring/web';
import {
    Container,
    Grid,
    Box,
    Typography,
    Button,
    Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import messagingService from '../services/messagingService';

function HomePage() {
    const [sessionCode, setSessionCode] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    // Build the universal link URL using the session code.
    const isLocal = false;
    const universalLinkUrl = !isLocal ?
        sessionCode
            ? `https://quick-relay.com/join?session=${sessionCode}`
            : 'https://quick-relay.com'
        :
        sessionCode
            ? `http://192.168.0.2:3000/join?session=${sessionCode}`
            : 'http://192.168.0.2:3000.com';

    // Trail animation for the two panes (left & right).
    const trail = useTrail(2, {
        from: { opacity: 0, transform: 'translate3d(0, 50px, 0)' },
        to: { opacity: 1, transform: 'translate3d(0, 0px, 0)' },
        config: { tension: 220, friction: 20 },
    });

    // Fade-in animation for the bottom section.
    const bottomFade = useSpring({
        from: { opacity: 0, transform: 'translate3d(0, 20px, 0)' },
        to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        delay: 400,
        config: { tension: 220, friction: 26 },
    });

    // Connect to the messaging service on mount.
    useEffect(() => {
        async function initSession() {
            try {
                // Create a new session (no session code provided).
                const result = await messagingService.connect();
                if (result && result.sessionCode) {
                    setSessionCode(result.sessionCode);
                    setConnectionStatus('Connected');
                    console.log('Session created:', result.sessionCode);
                } else {
                    console.error('Invalid response from messaging service:', result);
                }
            } catch (err) {
                console.error('Error during messaging connection:', err);
                setError('Error connecting to messaging service');
            }
        }
        initSession();
    }, []);

    // Listen for when messaging service reports RTC is fully connected.
    useEffect(() => {
        messagingService.onConnected(() => {
            // Navigate to ActiveSession when RTC connection is established.
            console.log("RTC connection established; navigating to ActiveSession");
            navigate(`/session?session=${sessionCode}`);
        });
    }, [sessionCode, navigate]);

    const handleCopyLink = () => {
        navigator.clipboard
            .writeText(universalLinkUrl)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch((err) => console.error('Error copying text:', err));
    };

    const handleJoinRedirect = () => {
        navigate(`/join?session=${sessionCode}`);
    };

    return (
        <animated.div>
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
                    <Grid container spacing={4}>
                        {trail.map((props, index) => (
                            <Grid item xs={12} md={6} key={index}>
                                <animated.div style={props}>
                                    {index === 0 ? (
                                        <Box
                                            display="flex"
                                            flexDirection="column"
                                            alignItems="center"
                                            justifyContent="center"
                                            sx={{
                                                backgroundColor: '#fff',
                                                p: 4,
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                            }}
                                            onClick={handleCopyLink}
                                        >
                                            <Typography variant="h5" color="primary" gutterBottom>
                                                Scan to Connect
                                            </Typography>
                                            <QRCodeSVG
                                                value={universalLinkUrl}
                                                style={{ width: 300, height: 300 }}
                                            />
                                            {copied && (
                                                <Typography variant="body2" color="success.main" mt={1}>
                                                    Link copied!
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Box
                                            display="flex"
                                            flexDirection="column"
                                            justifyContent="center"
                                            alignItems="center"
                                            sx={{
                                                backgroundColor: '#fafafa',
                                                p: 4,
                                                borderRadius: 2,
                                                height: '100%',
                                            }}
                                        >
                                            <Typography variant="h4" color="secondary" gutterBottom>
                                                Session Code
                                            </Typography>
                                            <Typography variant="h2" color="secondary">
                                                {sessionCode || '------'}
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" align="center" mt={2}>
                                                Share this code with your peer or have them enter it at{' '}
                                                <strong>quick-relay.com/join</strong>.
                                            </Typography>
                                        </Box>
                                    )}
                                </animated.div>
                            </Grid>
                        ))}
                    </Grid>
                    <animated.div style={bottomFade}>
                        <Box textAlign="center" mt={6}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Already have a code?
                            </Typography>
                            <Button variant="contained" color="secondary" onClick={handleJoinRedirect}>
                                Join Session
                            </Button>
                        </Box>
                        <Box textAlign="center" mt={3}>
                            <Typography variant="body2" color="text.secondary">
                                Connection Status: {connectionStatus}
                            </Typography>
                            {error && (
                                <Typography variant="body2" color="error" mt={1}>
                                    {error}
                                </Typography>
                            )}
                        </Box>
                    </animated.div>
                </Paper>
            </Container>
        </animated.div>
    );
}

export default HomePage;
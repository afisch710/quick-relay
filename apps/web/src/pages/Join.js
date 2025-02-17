// src/pages/Join.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Paper, Box, Typography, Button } from '@mui/material';
import SessionCodeInput from '../components/SessionCodeInput';
import messagingService from '../services/messagingService';
import { useNavigate, useSearchParams } from 'react-router-dom';

function Join() {
    const [manualSession, setManualSession] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // On mount, check for a "session" query parameter and pre-populate.
    useEffect(() => {
        const sessionFromURL = searchParams.get('session');
        if (sessionFromURL && /^\d{6}$/.test(sessionFromURL)) {
            setManualSession(sessionFromURL);
        }
    }, [searchParams]);

    // When manualSession is valid, attempt to join automatically.
    useEffect(() => {
        async function autoJoin() {
            if (manualSession && manualSession.length === 6) {
                try {
                    const result = await messagingService.connect(manualSession);
                    if (result && result.sessionCode) {
                        console.log('Auto-joined session:', result.sessionCode);
                        setConnectionStatus('Connected');
                        navigate(`/session?session=${result.sessionCode}`);
                    }
                } catch (err) {
                    console.error('Error auto-joining session:', err);
                    setError('Unable to join session.');
                }
            }
        }
        autoJoin();
    }, [manualSession, navigate]);

    const handleJoinManually = useCallback(async () => {
        if (!manualSession || manualSession.length !== 6) {
            setError('Please enter a valid 6-digit session code.');
            return;
        }
        try {
            const result = await messagingService.connect(manualSession);
            if (result && result.sessionCode) {
                console.log('Joined session:', result.sessionCode);
                setConnectionStatus('Connected');
                navigate(`/session?session=${result.sessionCode}`);
            }
        } catch (err) {
            console.error('Error joining session manually:', err);
            setError('Unable to join session.');
        }
    }, [manualSession, navigate]);

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
                <Box textAlign="center">
                    <Typography variant="h4" color="secondary" gutterBottom>
                        Join Session
                    </Typography>
                    <Typography variant="body1" color="secondary" paragraph>
                        If you cannot scan the QR code, enter the 6-digit session code below.
                    </Typography>
                    <SessionCodeInput
                        value={manualSession}
                        onChange={(code) => setManualSession(code)}
                    />
                    <Box mt={2}>
                        <Button variant="contained" color="primary" onClick={handleJoinManually}>
                            Join Session
                        </Button>
                    </Box>
                    {error && (
                        <Typography variant="body2" color="error" mt={2}>
                            {error}
                        </Typography>
                    )}
                    {connectionStatus && (
                        <Typography variant="body2" color="text.secondary" mt={2}>
                            Connection Status: {connectionStatus}
                        </Typography>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}

export default React.memo(Join);
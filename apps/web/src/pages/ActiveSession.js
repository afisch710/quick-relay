// src/pages/ActiveSession.js
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Paper, Box, Typography, Button, TextField } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import messagingService from '../services/messagingService';

function ActiveSession() {
    const [searchParams] = useSearchParams();
    const [sessionCode, setSessionCode] = useState('');
    // const [connectionStatus, setConnectionStatus] = useState('');
    const [signalInput, setSignalInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState('');
    // const [hasConnected, setHasConnected] = useState(false);

    // On mount, read the session code from the URL.
    useEffect(() => {
        const code = searchParams.get('session');
        if (code) {
            setSessionCode(code);
        }
    }, [searchParams]);

    // Set up a message listener for incoming messages.
    useEffect(() => {
        const listener = (msg) => {
            console.log("Received message:", msg);
            setMessages((prev) => [...prev, msg.data]);
        };
        messagingService.onMessage(listener);
        return () => {
            messagingService.removeMessageListener(listener);
        };
    }, []);

    const handleSendSignal = useCallback(async () => {
        if (!signalInput) return;
        // For example, we use type "ready" in this message.
        const msg = {
            action: "signal",
            sessionCode,
            type: "ready",
            data: signalInput,
        };
        try {
            await messagingService.sendMessage(msg);
            setSignalInput('');
        } catch (err) {
            console.error("Error sending message:", err);
            setError("Failed to send message.");
        }
    }, [signalInput, sessionCode]);

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
                <Box textAlign="center">
                    <Typography variant="h4" color="primary" gutterBottom>
                        Active Session
                    </Typography>
                    <Typography variant="h6" color="secondary">
                        Session Code: {sessionCode}
                    </Typography>
                    {error && (
                        <Typography variant="body2" color="error" mt={2}>
                            {error}
                        </Typography>
                    )}
                </Box>
                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>
                        Send a Signal Message (e.g. "I'm ready")
                    </Typography>
                    <Box display="flex" gap={2} alignItems="center">
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Signal Message"
                            value={signalInput}
                            onChange={(e) => setSignalInput(e.target.value)}
                        />
                        <Button variant="contained" color="primary" onClick={handleSendSignal}>
                            Send
                        </Button>
                    </Box>
                </Box>
                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>
                        Received Messages
                    </Typography>
                    {messages.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No messages received yet.
                        </Typography>
                    ) : (
                        messages.map((msg, index) => (
                            <Box key={index} p={1} my={1} border="1px solid #ccc" borderRadius={1}>
                                <Typography variant="body2" color="text.primary">
                                    {msg}
                                </Typography>
                            </Box>
                        ))
                    )}
                </Box>
            </Paper>
        </Container>
    );
}

export default React.memo(ActiveSession);
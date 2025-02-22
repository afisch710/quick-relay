import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack } from '@mui/material';
import { useTransition, animated } from '@react-spring/web';
import Join from './Join';
import Start from './Start';
import { useConnection } from '../../context/ConnectionProvider';
import { useDevice } from '../../context/DeviceProvider';
import OnboardingAnimation from './OnboardingAnimation';
import { useOnboarding } from '../../context/OnboardingProvider';
import ValueProp from './ValueProp';

const OnboardingPage = Object.freeze({
    valueProp: 'valueProp',
    start: 'start',
    join: 'join',
});

const Onboarding = ({ sessionToJoin = null, joinRequested = false, }) => {
    const { showValueProp } = useOnboarding();
    const { isMobile } = useDevice();
    const { connect } = useConnection();
    const [sessionCode, setSessionCode] = useState(null);
    const [page, setPage] = useState(
        sessionToJoin || joinRequested ?
            OnboardingPage.join :
            showValueProp ?
                OnboardingPage.valueProp :
                OnboardingPage.start
    );

    useEffect(() => {
        async function initConnection(code) {
            const result = await connect(code);
            if (result && result.sessionCode) {
                setSessionCode(result.sessionCode);
                console.log('Session created:', result.sessionCode);
            } else {
                console.error('Invalid response from messaging service:', result);
            }
        }

        initConnection(sessionToJoin);
    }, [sessionToJoin, page, connect])

    // Transition for the main content (Start/Join)
    const contentTransitions = useTransition(page, {
        from: { opacity: 0, transform: 'translateY(20px)' },
        enter: { opacity: 1, transform: 'translateY(0px)' },
        leave: { opacity: 0, transform: 'translateY(-20px)' },
        config: { tension: 250, friction: 20 },
    });

    return (
        <Stack direction="column" height="100%" spacing={2} position="relative">
            {/* Fixed container for animated content */}
            <Box
                display={'flex'}
                flexGrow={1}>
                {contentTransitions((style, item) =>
                    item === OnboardingPage.valueProp ?
                        (
                            <animated.div style={{ ...style, position: 'absolute', width: '100%', height: '100%' }}>
                                <ValueProp onGetStarted={() => setPage(OnboardingPage.start)} />
                            </animated.div>
                        ) :
                        item === OnboardingPage.start ?
                            (
                                <animated.div style={{ ...style, position: 'absolute', width: '100%', height: '100%' }}>
                                    <Start isLocal={true} sessionCode={sessionCode} requestJoin={() => setPage(OnboardingPage.join)} />
                                </animated.div>
                            ) :
                            (
                                <animated.div style={{ ...style, position: 'absolute', width: '100%', height: '100%' }}>
                                    <Join sessionToJoin={sessionToJoin} requestStart={() => setPage(OnboardingPage.start)} />
                                </animated.div>
                            )
                )}
            </Box>
            <OnboardingAnimation position={isMobile ? 'top' : 'bottom'} />
        </Stack >
    );
};

Onboarding.propTypes = {
    sessionToJoin: PropTypes.number,
    joinRequested: PropTypes.bool,
};

export default Onboarding;
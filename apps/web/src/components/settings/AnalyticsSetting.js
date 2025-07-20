// AnalyticsSetting.js
import React, { useState, useEffect, useCallback } from 'react';
import SettingEntry from './SettingEntry';
import ToggleSwitch from '../common/ToggleSwitch';
import { useAnalytics } from '../../context/AnalyticsProvider';

const AnalyticsSetting = () => {
    const { isAnalyticsEnabled, setAnalyticsEnabled } = useAnalytics();
    const [analyticsEnabled, setAnalyticsEnabledLocal] = useState(isAnalyticsEnabled);

    useEffect(() => {
        setAnalyticsEnabledLocal(isAnalyticsEnabled);
    }, [isAnalyticsEnabled]);

    const handleAnalyticsChange = useCallback(
        (event) => {
            const newValue = event.target.checked;
            setAnalyticsEnabledLocal(newValue);
            setAnalyticsEnabled(newValue);
        },
        [setAnalyticsEnabled]
    );

    return (
        <SettingEntry label="Enable anonymous analytics to help improve Pourtle">
            <ToggleSwitch
                checked={analyticsEnabled}
                onChange={handleAnalyticsChange}
            />
        </SettingEntry>
    );
};

export default AnalyticsSetting; 
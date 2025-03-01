// AutoDownloadSetting.js
import React, { useState, useEffect, useCallback } from 'react';
import SettingEntry from './SettingEntry';
import ToggleSwitch from '../common/ToggleSwitch';
import { useSettings } from '../../context/SettingsProvider';

const AutoDownloadSetting = () => {
    const { autoDownload, updateAutoDownload } = useSettings();
    const [autoDownloadEnabled, setAutoDownloadEnabled] = useState(autoDownload ?? false);

    useEffect(() => {
        setAutoDownloadEnabled(autoDownload ?? false);
    }, [autoDownload]);

    const handleAutoDownloadChange = useCallback(
        (event) => {
            const newValue = event.target.checked;
            setAutoDownloadEnabled(newValue);
            updateAutoDownload(newValue);
        },
        [updateAutoDownload]
    );

    return (
        <SettingEntry label="Automatically download shared content to this device">
            <ToggleSwitch
                checked={autoDownloadEnabled}
                onChange={handleAutoDownloadChange}
            />
        </SettingEntry>
    );
};

export default React.memo(AutoDownloadSetting);
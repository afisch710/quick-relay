// src/components/SessionCodeInput.js
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

function SessionCodeInput({ length = 6, value = '', onChange }) {
    const initialValues = value ? value.split('').slice(0, length) : Array(length).fill('');
    const [values, setValues] = useState(initialValues);
    const inputsRef = React.useRef([]);

    // Update state if the passed value changes
    useEffect(() => {
        const newValues = value ? value.split('').slice(0, length) : Array(length).fill('');
        setValues(newValues);
    }, [value, length]);

    // Auto-focus the first input on mount.
    useEffect(() => {
        if (inputsRef.current[0]) {
            inputsRef.current[0].focus();
        }
    }, []);

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (!/^[A-Za-z0-9]*$/.test(val)) return; // Only allow alphanumeric.
        if (val.length > 1) return; // Ensure only one character per box.
        const newValues = [...values];
        newValues[index] = val.toUpperCase();
        setValues(newValues);
        if (onChange) {
            onChange(newValues.join(''));
        }
        // Automatically focus the next input if available.
        if (val && index < length - 1) {
            inputsRef.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            inputsRef.current[index - 1].focus();
        }
    };

    return (
        <Box display="flex" justifyContent="center" gap={1}>
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={values[index] || ''}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => (inputsRef.current[index] = el)}
                    style={{
                        width: '3rem',
                        height: '3rem',
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        border: '1px solid #1976d2',
                        borderRadius: '4px',
                    }}
                />
            ))}
        </Box>
    );
}

export default SessionCodeInput;
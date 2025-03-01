// src/components/onboarding/SessionCodeInput.js
import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { useTrail, animated } from '@react-spring/web';
import { styled } from '@mui/material/styles';

const StyledInput = styled('input')(({ theme, inputSize }) => ({
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.secondary,
    width: inputSize,
    height: inputSize,
    textAlign: 'center',
    // Center text vertically by setting the line height equal to the height.
    lineHeight: `${inputSize}px`,
    fontSize: inputSize / 2,
    borderRadius: '4px',
    // Hide any overflow (and thus any scrollbars)
    overflow: 'hidden',
    // Hide scrollbars (for Webkit browsers)
    '&::-webkit-scrollbar': {
        display: 'none',
    },
    // Remove number input spinners if using type="number"
    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
        WebkitAppearance: 'none',
        margin: 0,
    },
    // Override disabled styling to maintain text color.
    '&:disabled': {
        opacity: 1,
        color: theme.palette.text.primary,
    },
}));

const SessionCodeInput = forwardRef(function SessionCodeInput(
    {
        length = 6,
        value = '',
        onChange,
        editable = true,
        hideEmpty = true,
        inputSize = 40,
    },
    ref
) {
    // Calculate the fixed width: assume each input is 3rem wide and each gap is 0.5rem.
    const inputWidth = 3; // in rem units
    const gap = 0.5; // in rem units
    const containerWidth = length * inputWidth + (length - 1) * gap; // in rem

    // Derive initial input values from the passed value.
    const initialValues = value ? value.split('').slice(0, length) : Array(length).fill('');
    const [values, setValues] = useState(initialValues);
    const inputsRef = useRef([]);
    // This flag indicates if we should render the inputs (and animate them in)
    const [shouldRenderInputs, setShouldRenderInputs] = useState(
        !hideEmpty || (value && value.trim() !== '')
    );
    // This flag indicates whether to animate the inputs in.
    const [animate, setAnimate] = useState(false);

    // Update state if the passed value changes.
    useEffect(() => {
        const newValues = value ? value.split('').slice(0, length) : Array(length).fill('');
        setValues(newValues);
        if (hideEmpty) {
            if (value && value.trim() !== '') {
                // When a valid value first appears, set flag and trigger animation.
                setShouldRenderInputs(true);
                setAnimate(true);
            } else {
                // If value becomes empty, hide the inputs.
                setShouldRenderInputs(false);
                setAnimate(false);
            }
        }
    }, [value, length, hideEmpty]);

    // Auto-focus the first input on mount.
    useEffect(() => {
        if (inputsRef.current[0]) {
            inputsRef.current[0].focus();
        }
    }, []);

    // Create a trail animation for each input box.
    // The trail animates from opacity 0 to 1.
    const trail = useTrail(length, {
        from: { opacity: 0 },
        to: { opacity: animate ? 1 : 1 }, // final state should be fully opaque.
        config: { tension: 200, friction: 20 },
        delay: 200,
    });

    const handleChange = useCallback((e, index) => {
        const val = e.target.value;
        if (!/^[A-Za-z0-9]*$/.test(val)) return; // Only allow alphanumeric.
        if (val.length > 1) return; // Only one character per box.
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
    }, [length, onChange, values]);

    const handleKeyDown = useCallback((e, index) => {
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            inputsRef.current[index - 1].focus();
        }
    }, [values]);

    // Expose a clear() method to the parent via ref.
    useImperativeHandle(ref, () => ({
        clear: () => {
            const cleared = Array(length).fill('');
            setValues(cleared);
            if (hideEmpty) {
                setShouldRenderInputs(false);
            }
            if (onChange) {
                onChange('');
            }
            // Focus the first input if it exists.
            setTimeout(() => {
                if (inputsRef.current[0]) {
                    inputsRef.current[0].focus();
                }
            }, 100);
        },
    }));

    // Always render a container of fixed width (using rem units) so that layout is stable.
    return (
        <Box
            display="flex"
            justifyContent="center"
            gap={`${gap}rem`}
            sx={{ width: `${containerWidth}rem`, minWidth: `${containerWidth}rem`, height: '3rem' }}
        >
            {shouldRenderInputs
                ? Array.from({ length }).map((_, index) => {
                    const inputElement = (
                        <StyledInput
                            disabled={!editable}
                            key={index}
                            type="number"
                            maxLength={1}
                            value={values[index] || ''}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            inputSize={inputSize}
                            ref={(el) => (inputsRef.current[index] = el)}
                        />
                    );
                    return animate ? (
                        <animated.div key={index} style={trail[index]}>
                            {inputElement}
                        </animated.div>
                    ) : (
                        <Box key={index} sx={{ flex: 1 }}>
                            {inputElement}
                        </Box>
                    );
                })
                : null}
        </Box>
    );
});

SessionCodeInput.propTypes = {
    length: PropTypes.number,
    value: PropTypes.string,
    onChange: PropTypes.func,
    editable: PropTypes.bool,
    hideEmpty: PropTypes.bool,
    inputSize: PropTypes.number,
};

export default React.memo(SessionCodeInput);
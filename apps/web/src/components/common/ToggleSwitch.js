// ToggleSwitch.js
import React from 'react';
import PropTypes from 'prop-types';
import { Switch, useTheme } from '@mui/material';

const ToggleSwitch = ({ checked, onChange, ...rest }) => {
  const theme = useTheme();
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      sx={{
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: theme.palette.background.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
          backgroundColor: '#05f745',
        },
        '& .MuiSwitch-track': {
          backgroundColor: theme.palette.text.secondary,
        },
        '& .MuiSwitch-thumb': {
          backgroundColor: theme.palette.background.primary,
        },
      }}
      {...rest}
    />
  );
};

ToggleSwitch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default React.memo(ToggleSwitch);
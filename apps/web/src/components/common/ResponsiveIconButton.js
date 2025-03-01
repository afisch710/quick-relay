import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { alpha, IconButton, Tooltip, useTheme } from '@mui/material';
import { useModal } from '../../context/ModalProvider';

const ResponsiveIconButton = ({
  icon: IconComponent,
  onClick,
  tooltip,
  fontSize,
  size,
  color,
  sx,
  ...rest
}) => {
  const { isModalOpen } = useModal();
  const theme = useTheme();

  const handleClick = useCallback((event) => {
    event.stopPropagation();
    event.preventDefault();
    if (onClick) onClick(event);
  }, [onClick]);

  return (
    <Tooltip
      title={tooltip}
      placement="bottom"
      slotProps={{
        tooltip: {
          sx: {
            color: theme.palette.text.primary,
            bgcolor: theme.palette.background.secondary,
            border: `1px solid ${theme.palette.text.secondary}`,
          },
        },
      }}
    >
      <IconButton
        onClick={handleClick}
        sx={{
          width: 40,
          height: 40,
          borderRadius: '8px',
          transition: 'background-color 0.3s',
          '&:hover': isModalOpen ?
            {} :  // Ensure if a modal is opened, no residual hover state remains after a button click
            {
              backgroundColor: alpha(theme.palette.text.secondary, 0.1),
            },
          ...sx,
        }}
        {...rest}
      >
        <IconComponent
          sx={{
            color: color || theme.palette.text.primary,
            fontSize: size || fontSize,
          }}
        />
      </IconButton>
    </Tooltip >
  );
};

ResponsiveIconButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  onClick: PropTypes.func.isRequired,
  tooltip: PropTypes.string.isRequired,
  fontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
  sx: PropTypes.object,
};

ResponsiveIconButton.defaultProps = {
  fontSize: undefined,
  size: undefined,
  color: undefined,
  sx: {},
};

export default React.memo(ResponsiveIconButton);
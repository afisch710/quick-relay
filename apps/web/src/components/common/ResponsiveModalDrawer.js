import React from "react";
import PropTypes from "prop-types";
import { Drawer, Modal, Box, Fade, useTheme } from "@mui/material";
import { useDevice } from "../../context/DeviceProvider";

const ResponsiveModalDrawer = ({ open, canClose = true, onClose, children }) => {
    const theme = useTheme();
    const { isMobile } = useDevice();

    // A handler that checks if closing is allowed before triggering onClose.
    const handleClose = (event, reason) => {
        if (canClose && onClose) {
            onClose(event, reason);
        }
    };

    return isMobile ? (
        // Mobile view: Bottom drawer occupying 60% of viewport height
        <Drawer
            anchor="bottom"
            open={open}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    backgroundColor: theme.palette.background.tertiary,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                },
            }}>
            <Box
                pt={4}
                pl={2}
                pr={2}
                pb={4}
                sx={{
                    height: "70dvh",
                    overflowY: "auto",
                }}
            >
                {children}
            </Box>
        </Drawer>
    ) : (
        // Desktop view: Centered modal with a fixed height of 500px and a fade transition
        <Modal disableAutoFocus open={open} onClose={handleClose}>
            <Fade in={open}>
                <Box
                    autoFocus
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 700,
                        height: 350,
                        bgcolor: theme.palette.background.tertiary,
                        boxShadow: 24,
                        pt: 4,
                        pl: 2,
                        pr: 2,
                        pb: 4,
                        borderRadius: 4,
                        overflowY: "auto",
                    }}
                >
                    {children}
                </Box>
            </Fade>
        </Modal>
    );
};

ResponsiveModalDrawer.propTypes = {
    open: PropTypes.bool.isRequired,
    canClose: PropTypes.bool,
    onClose: PropTypes.func,
    children: PropTypes.element.isRequired,
};

export default ResponsiveModalDrawer;
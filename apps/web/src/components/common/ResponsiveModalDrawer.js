import React, { useCallback } from "react";
import PropTypes from "prop-types";
import {
    Modal,
    Box,
    Fade,
    useTheme,
    SwipeableDrawer,
    Drawer,
} from "@mui/material";
import { useDevice } from "../../context/DeviceProvider";
import { useModal } from "../../context/ModalProvider";
// import CloseIcon from '@mui/icons-material/Close';
// import ResponsiveIconButton from "./ResponsiveIconButton";

const ResponsiveModalDrawer = ({ open, canClose = true, onClose, children, modalProps = {} }) => {
    const { dismissModal } = useModal();
    const theme = useTheme();
    const { isMobile } = useDevice();

    // Handler that checks if closing is allowed before triggering onClose.
    const handleClose = useCallback(
        (event, reason) => {
            if (canClose) {
                dismissModal();
                if (onClose) {
                    onClose(event, reason);
                }
            }
        },
        [canClose, onClose, dismissModal]
    );

    // Common props for the paper element.
    const commonPaperProps = {
        sx: {
            backgroundColor: theme.palette.background.tertiary,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
        },
    };

    // Content container for the drawer.
    const drawerContent = (
        <Box
            pt={4}
            pl={2}
            pr={2}
            pb={4}
            sx={{
                height: modalProps?.mobileHeight ?? "60dvh",
                overflowY: "auto",
            }}
        >
            {children}
        </Box>
    );

    if (isMobile) {
        // Choose the mobile drawer component based on canClose.
        const MobileDrawerComponent = canClose ? SwipeableDrawer : Drawer;
        return (
            <MobileDrawerComponent
                anchor="bottom"
                open={open}
                onClose={canClose ? handleClose : () => { }}
                PaperProps={commonPaperProps}
            >
                {drawerContent}
            </MobileDrawerComponent>
        );
    } else {
        // Desktop view: Centered modal with a fade transition.
        return (
            <Modal
                disableAutoFocus
                open={open}
                onClose={handleClose}>
                <Fade in={open}>
                    <Box
                        autoFocus
                        display={'table'}
                        width={modalProps?.width ?? 'auto'}
                        maxWidth={modalProps?.maxWidth ?? '90vw'}
                        height={modalProps?.height ?? 'auto'}
                        maxHeight={modalProps?.maxHeight ?? '90dvh'}
                        bgcolor={theme.palette.background.tertiary}
                        position={'relative'}
                        boxShadow={24}
                        top={'50%'}
                        left={'50%'}
                        border={`1px solid ${theme.palette.text.secondary}`}
                        pt={4}
                        pl={2}
                        pr={2}
                        pb={4}
                        borderRadius={4}
                        sx={{
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        {children}
                    </Box>
                </Fade>
            </Modal>
        );
    }
};

ResponsiveModalDrawer.propTypes = {
    open: PropTypes.bool.isRequired,
    canClose: PropTypes.bool,
    onClose: PropTypes.func,
    modalProps: PropTypes.object,
    children: PropTypes.element.isRequired,
};

export default React.memo(ResponsiveModalDrawer);
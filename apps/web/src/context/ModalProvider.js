import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const ModalContext = createContext({
    isModalOpen: true,
    modalContent: null,
    modalCanClose: true,
    modalOnClose: () => { },
    showModal: () => { },
    updateModal: () => { },
    dismissModal: () => { },
    modalProps: {},
});

export const ModalProvider = ({ children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [modalContent, setModalContent] = useState(null);
    const [modalCanClose, setModalCanClose] = useState(true);
    const [modalOnClose, setmodalOnClose] = useState(() => { });

    const showModal = useCallback((content, canClose, onClose = () => { }, modalProps = {}) => {
        setModalContent(content);
        setModalProps(modalProps);
        setModalCanClose(canClose);
        setmodalOnClose(onClose);
        setIsModalOpen(true);
    }, []);

    const updateModal = useCallback((content, modalProps = {}) => {
        setModalContent(content);
        setModalProps(modalProps);
    }, []);

    const dismissModal = useCallback(() => {
        setIsModalOpen(false);
        setModalContent(null);
    }, [])

    const value = useMemo(() => {
        return (
            {
                isModalOpen,
                modalContent,
                modalCanClose,
                modalOnClose,
                showModal,
                updateModal,
                dismissModal,
                modalProps,
            });
    }, [
        isModalOpen,
        modalContent,
        modalCanClose,
        modalOnClose,
        showModal,
        updateModal,
        dismissModal,
        modalProps,
    ]);

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

ModalProvider.propTypes = {
    children: PropTypes.node,
};

export const useModal = () => useContext(ModalContext);

export default React.memo(ModalProvider);
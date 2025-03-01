import React, { createContext, useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useModal } from './ModalProvider';
import MyPreview from '../components/share/preview/Preview';
import { pdfjs } from 'react-pdf';

// Set the workerSrc to point to the distributed pdf.worker
// PreviewProvider is a good candidate for this as it needs
// to happen just once.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const PreviewContext = createContext({
    showPreview: () => { },
});

export const PreviewProvider = ({ children }) => {
    const { showModal } = useModal();

    // Preview UX
    const showPreview = useCallback((file) => {
        const Preview = <MyPreview file={file} />
        const canClose = true;
        const onClose = () => { };
        const modalProps = {
            mobileHeight: '70dvh',
        };
        showModal(Preview, canClose, onClose, modalProps);
    }, [showModal]);

    const value = useMemo(() => {
        return (
            {
                showPreview,
            }
        );
    }, [showPreview]);


    return (
        <PreviewContext.Provider value={value}>
            {children}
        </PreviewContext.Provider>
    );
};

PreviewProvider.propTypes = {
    children: PropTypes.node,
};

export const usePreview = () => useContext(PreviewContext);

export default React.memo(PreviewProvider);
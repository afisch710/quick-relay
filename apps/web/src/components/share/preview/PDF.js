import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { Box } from "@mui/material";
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import PreviewUnavailable from "./PreviewUnavailable";
import { useDevice } from "../../../context/DeviceProvider";

const PDF = ({ file }) => {
    const { isMobile } = useDevice();
    const [url, setUrl] = useState(null);
    const [error, setError] = useState(false);
    const [numPages, setNumPages] = useState(0);

    useEffect(() => {
        const objUrl = URL.createObjectURL(file);
        setUrl(objUrl);
        return () => {
            URL.revokeObjectURL(objUrl);
        };
    }, [file]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
            width="100%"
        >
            {error ? (
                <PreviewUnavailable file={file} />
            ) : (
                <Box
                    width="100%"
                    borderRadius={4}
                    sx={{
                        overflowY: "auto", // Enable vertical scrolling if content is taller than the container
                        overflowX: "hidden",
                    }}
                    onTouchMove={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <Document
                        file={url}
                        onLoadError={() => setError(true)}
                        onLoadSuccess={onDocumentLoadSuccess}
                    >
                        {Array.from(new Array(numPages), (el, index) => (
                            <Page
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                width={isMobile ? (window.innerWidth - 30) : 600}
                            />
                        ))}
                    </Document>
                </Box>
            )}
        </Box>
    );
};

PDF.propTypes = {
    file: PropTypes.object.isRequired,
};

export default React.memo(PDF);
import JSZip from 'jszip';
import React, { useCallback, createContext, useContext } from 'react';

const DownloadContext = createContext({
  downloadFiles: () => { },
});

const DownloadProvider = ({ children }) => {
  // downloadFiles is a function that takes an array of local files.
  // Each file is assumed to have metadata (containing fileName, fileType, etc.)
  // and data (an ArrayBuffer or Blob).
  const downloadFiles = useCallback(async (localFiles, displayName) => {
    if (!localFiles || localFiles.length === 0) return;

    // Helper: ensure the data is a Blob.
    const toBlob = (data, type) =>
      data instanceof Blob ? data : new Blob([data], { type });

    if (localFiles.length === 1) {
      const file = localFiles[0];
      const blob = toBlob(file.data, file.metadata.fileType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.metadata.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } else {
      const zip = new JSZip();
      // Add each file to the zip.
      for (const file of localFiles) {
        const blob = toBlob(file.data, file.metadata.fileType);
        // Use the file's name from metadata.
        zip.file(file.metadata.fileName, blob);
      }
      // Generate the zip as a Blob.
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pourtle_${displayName}_${new Date().getTime()}.zip`.toLowerCase();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    }
  }, []);

  return (
    <DownloadContext.Provider value={{ downloadFiles }}>
      {children}
    </DownloadContext.Provider>
  );
};

export const useDownload = () => useContext(DownloadContext);

export default React.memo(DownloadProvider);
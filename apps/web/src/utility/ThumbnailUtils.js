// utils/ThumbnailUtils.js
export async function generateThumbnailForFile(file) {
    // Ensure file.type exists and is lowercased.
    const lowerType = file.type ? file.type.toLowerCase() : "";
    if (lowerType.startsWith("image/")) {
        return generateImageThumbnail(file);
    } else if (lowerType.startsWith("video/")) {
        return generateVideoThumbnail(file);
    }
    return null;
}

export function generateImageThumbnail(file, mimeType = 'image/png') {
    return new Promise((resolve, reject) => {
        // If file is not a Blob, wrap it in one.
        const blob = file instanceof Blob ? file : new Blob([file], { type: mimeType });
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // Data URL
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(blob);
    });
}

export function generateVideoThumbnail(file, mimeType = 'video/mp4') {
    return new Promise((resolve, reject) => {
        // If file is not a Blob, wrap it in one.
        const blob = file instanceof Blob ? file : new Blob([file], { type: mimeType });
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(blob);
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            // Seek to 1 second if possible, otherwise start at 0.
            video.currentTime = video.duration > 1 ? 1 : 0;
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
            URL.revokeObjectURL(video.src);
        };

        video.onerror = (err) => {
            reject(err);
        };
    });
}
import React, { useState } from 'react';
import './css/GeneratedImage.css';

export default function GeneratedImage({ resultData, handleDownloadImage, handleCancelImage }) {
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const handleImageLoad = () => {
        setLoading(false);
    };

    const handleDownloadClick = async () => {
        setDownloading(true);
        try {
            await handleDownloadImage();
        } catch (error) {
            console.error('Error during download:', error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        resultData && (
            <div className='generated-image-main-container'>
                <div className="generated-image-container">
                    <h3>Generated Image</h3>
                    {loading && <div className="image-conversion-loader"><span></span></div>}
                    <img
                        src={resultData.url}
                        alt="Generated"
                        onLoad={handleImageLoad}
                        style={{ display: loading ? 'none' : 'block' }}
                        className='generated_image'
                    />
                    <div className="button-group">
                        <button onClick={handleDownloadClick} disabled={downloading}>
                            {downloading ? 'Downloading...' : 'Download'}
                        </button>
                        <button className="cancel-button" onClick={handleCancelImage}>Cancel</button>
                    </div>
                </div>
            </div>
        )
    );
}

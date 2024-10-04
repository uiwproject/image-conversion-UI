import React from 'react';
import './css/WarningModal.css';

export default function WarningModal({ isOpen, onClose, handlePrimary, setGenerateClickedBefore }) {
    if (!isOpen) return null;

    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Important Notice:</h2>
                <p className="subheading">Inappropriate images are not allowed. This includes:</p>
                <ul className="bullet-list">
                    <li className='list-content-xss'>
                        <strong>Violent Content:</strong> <span className='list-content-child'>Any images depicting violence or harm.</span>
                    </li>
                    <li className='list-content-xss'>
                        <strong>Pornographic Content:</strong> <span className='list-content-child'>Any explicit or sexually suggestive images.</span>
                    </li>
                    <li className='list-content-xss'>
                        <strong>Political Content:</strong> <span className='list-content-child'>Any images related to political messages or symbols.</span>
                    </li>
                </ul>
                <p className="important">
                    Please ensure that your images comply with these guidelines. Images that do not adhere to these standards will be rejected.
                </p>
                <button
                    className="modal-button"
                    onClick={() => {
                        setGenerateClickedBefore(true)
                        onClose()
                        handlePrimary()
                    }}
                >
                    Ok, accept.
                </button>
            </div>
        </div>
    );
}

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

export default function UploadControl({ onUpload }) {
    const fileInput = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onUpload(url);
        }
    };

    return (
        <div style={{ pointerEvents: 'auto' }}>
            <input
                type="file"
                ref={fileInput}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
            />
            <button
                className="btn-primary"
                onClick={() => fileInput.current.click()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <Upload size={18} />
                <span>Upload Map</span>
            </button>
        </div>
    );
}

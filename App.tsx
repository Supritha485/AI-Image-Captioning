
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateCaption } from './services/geminiService';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ZoomInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
);

const ZoomOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
    </svg>
);

const ResetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
    </svg>
);


const LoadingSpinner = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    onClearImage: () => void;
    previewUrl: string | null;
    isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, onClearImage, previewUrl, isLoading }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const handleResetView = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    useEffect(() => {
        if (!previewUrl) {
            handleResetView();
        }
    }, [previewUrl, handleResetView]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageSelect(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (isLoading) return;
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageSelect(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleClick = () => {
        if (!previewUrl) {
            fileInputRef.current?.click();
        }
    };
    
    const handleClearClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onClearImage();
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLLabelElement>) => {
        if (!previewUrl || e.button !== 0) return;
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLLabelElement>) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
    };

    const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLLabelElement>) => {
        if (isDragging) {
            e.preventDefault();
            setIsDragging(false);
        }
    };

    const handleWheel = (e: React.WheelEvent<HTMLLabelElement>) => {
        if (!previewUrl) return;
        e.preventDefault();
        const newScale = scale - e.deltaY * 0.005;
        setScale(Math.min(Math.max(newScale, 0.5), 5));
    };
    
    const handleZoom = (e: React.MouseEvent<HTMLButtonElement>, direction: 'in' | 'out') => {
        e.preventDefault();
        e.stopPropagation();
        const newScale = direction === 'in' ? scale * 1.2 : scale / 1.2;
        setScale(Math.min(Math.max(newScale, 0.5), 5));
    };

    const handleResetClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleResetView();
    };


    return (
        <div className="w-full">
            <label
                htmlFor="file-upload"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onWheel={handleWheel}
                className={`relative flex justify-center items-center w-full h-64 sm:h-80 border-2 border-dashed rounded-2xl transition-all duration-300 overflow-hidden
                ${isLoading ? 'opacity-50 pointer-events-none' : 'hover:border-primary border-secondary'}
                ${previewUrl ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'}`}
                onClick={handleClick}
            >
                {previewUrl ? (
                    <>
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="absolute max-w-none transition-transform duration-100 ease-out"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                            }}
                         />
                        <button 
                            onClick={handleClearClick}
                            aria-label="Clear image"
                            className="absolute top-2 right-2 z-10 p-2 bg-black bg-opacity-30 text-white rounded-full hover:bg-opacity-50 transition-colors"
                        >
                            <CloseIcon />
                        </button>
                        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-black bg-opacity-30 p-1.5 rounded-full">
                            <button onClick={(e) => handleZoom(e, 'out')} aria-label="Zoom out" className="p-1 text-white hover:text-primary transition-colors"><ZoomOutIcon/></button>
                            <button onClick={(e) => handleZoom(e, 'in')} aria-label="Zoom in" className="p-1 text-white hover:text-primary transition-colors"><ZoomInIcon/></button>
                            <button onClick={handleResetClick} aria-label="Reset view" className="p-1 text-white hover:text-primary transition-colors"><ResetIcon/></button>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-4">
                        <UploadIcon />
                        <p className="mt-2 text-sm text-text-secondary">
                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                )}
                <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    disabled={isLoading}
                />
            </label>
        </div>
    );
};


const App: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [caption, setCaption] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageSelect = (file: File) => {
        setImageFile(file);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(URL.createObjectURL(file));
        setCaption('');
        setError(null);
    };
    
    const handleClearImage = () => {
        setImageFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setCaption('');
        setError(null);
    };

    const handleGenerateCaption = useCallback(async () => {
        if (!imageFile) {
            setError('Please upload an image first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setCaption('');

        try {
            const result = await generateCaption(imageFile);
            setCaption(result);
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [imageFile]);

    return (
        <div className="min-h-screen bg-base text-text-primary font-sans flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <main className="w-full max-w-2xl mx-auto">
                <div className="bg-surface rounded-3xl shadow-2xl shadow-pink-200/50 p-6 sm:p-10">
                    <header className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
                            AI Image Captioner
                        </h1>
                        <p className="mt-2 text-md text-text-secondary">
                            Let Gemini bring your images to life with a story.
                        </p>
                    </header>

                    <div className="space-y-6">
                        <ImageUploader 
                            onImageSelect={handleImageSelect}
                            onClearImage={handleClearImage}
                            previewUrl={previewUrl}
                            isLoading={isLoading} 
                        />

                        <button
                            onClick={handleGenerateCaption}
                            disabled={!imageFile || isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-hover disabled:bg-pink-300 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {isLoading ? 'Generating...' : 'Generate Caption'}
                        </button>

                        {(isLoading || caption || error) && (
                            <div className="bg-pink-50 rounded-2xl p-6 min-h-[100px] flex items-center justify-center">
                                {isLoading && <LoadingSpinner />}
                                {error && <p className="text-center text-red-600">{error}</p>}
                                {caption && !isLoading && (
                                    <p className="text-text-secondary text-center text-lg leading-relaxed">
                                        {caption}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                 <footer className="text-center mt-8">
                    <p className="text-sm text-gray-500">Powered by Google Gemini</p>
                </footer>
            </main>
        </div>
    );
};

export default App;
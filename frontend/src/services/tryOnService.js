/**
 * Try-On Service - Virtual Try-On API Client
 * Connects to FastAPI backend for AI-powered virtual try-on
 */

const TRYON_API_URL = import.meta.env.VITE_TRYON_API_URL || 'http://localhost:8084';

/**
 * Check if try-on service is available
 */
export const checkHealth = async () => {
    try {
        const response = await fetch(`${TRYON_API_URL}/api/health`);
        if (!response.ok) {
            throw new Error('Service unavailable');
        }
        return await response.json();
    } catch (error) {
        console.error('Try-on service health check failed:', error);
        return { status: 'unavailable', gpu_available: false, model_loaded: false };
    }
};

/**
 * Perform virtual try-on
 * @param {File} personImage - Full body image of the person
 * @param {File} garmentImage - Image of the garment/clothing
 * @param {string} category - Type of garment (upper_body, lower_body, full_body)
 * @returns {Promise<Blob>} - Result image as blob
 */
export const tryOn = async (personImage, garmentImage, category = 'upper_body') => {
    const formData = new FormData();
    formData.append('person_image', personImage);
    formData.append('garment_image', garmentImage);
    formData.append('category', category);

    const response = await fetch(`${TRYON_API_URL}/api/try-on`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `Try-on failed: ${response.status}`);
    }

    // Get processing time from header
    const processingTime = response.headers.get('X-Processing-Time');
    console.log(`Try-on completed in ${processingTime}s`);

    return await response.blob();
};

/**
 * Try-on with fabric from catalog
 * @param {File} personImage - Full body image of the person
 * @param {number} fabricId - ID of the fabric from catalog
 * @param {string} garmentType - Type of garment (shirt, pants, dress, ao_dai)
 */
export const tryOnWithFabric = async (personImage, fabricId, garmentType = 'shirt') => {
    const formData = new FormData();
    formData.append('person_image', personImage);
    formData.append('fabric_id', fabricId);
    formData.append('garment_type', garmentType);

    const response = await fetch(`${TRYON_API_URL}/api/try-on/fabric`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `Try-on failed: ${response.status}`);
    }

    return await response.blob();
};

/**
 * Remove background from garment image
 * @param {File} image - Image to segment
 * @returns {Promise<Blob>} - Segmented image as blob
 */
export const segmentGarment = async (image) => {
    const formData = new FormData();
    formData.append('image', image);

    const response = await fetch(`${TRYON_API_URL}/api/segment`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `Segmentation failed: ${response.status}`);
    }

    return await response.blob();
};

/**
 * Convert blob to base64 for display
 */
export const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Create object URL from blob for display
 */
export const blobToUrl = (blob) => {
    return URL.createObjectURL(blob);
};

export const tryOnService = {
    checkHealth,
    tryOn,
    tryOnWithFabric,
    segmentGarment,
    blobToBase64,
    blobToUrl,
};

export default tryOnService;

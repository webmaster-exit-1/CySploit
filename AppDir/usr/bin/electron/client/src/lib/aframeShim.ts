// This file provides a shim for AFRAME to ensure it's properly initialized
// before any components try to use it
declare global {
  interface Window {
    AFRAME: any;
  }
}

// Ensure AFRAME is defined globally
if (typeof window !== 'undefined' && !window.AFRAME) {
  window.AFRAME = {}; 
  console.warn('AFRAME shim initialized. The real AFRAME library should be loaded from CDN.');
}

export default window.AFRAME;
/**
 * API Configuration
 * Centralizes absolute URLs for all backend services.
 * Falls back to local development defaults if environment variables are missing.
 */

// Auth Service (Sign-in, Sign-up)
export const AUTH_API_BASE = import.meta.env.VITE_AUTH_TARGET || "http://localhost:8003";

// Core Service (Query, Sessions, History)
export const CORE_API_BASE = import.meta.env.VITE_CORE_TARGET || "http://localhost:8000";

// Memory Service (Mem0 / Profiles)
export const MEM0_API_BASE = import.meta.env.VITE_MEM0_TARGET || "http://localhost:8001";

// WebSocket Service
export const WS_API_BASE = import.meta.env.VITE_WS_TARGET || "ws://localhost:8000";

/**
 * Helper to construct full URLs
 * @param {string} base - The base URL
 * @param {string} endpoint - The endpoint path (should start with /)
 * @returns {string} - The full absolute URL
 */
export const getFullUrl = (base, endpoint) => {
  // Ensure we don't have double slashes if the base ends with one
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${cleanBase}${endpoint}`;
};

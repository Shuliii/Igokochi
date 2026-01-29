// src/config.js
const runtime = window.__ENV || {};

export const API_BASE_URL =
  runtime.API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:4000";

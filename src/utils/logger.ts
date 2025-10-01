/**
 * Logger utility for conditional logging based on environment configuration
 * 
 * This utility provides conditional logging that respects the ENABLE_DEBUG and ENABLE_LOGGING
 * configuration flags, preventing debug logs from appearing in production.
 */

import { API_CONFIG } from '../config/api';
import { getEnvironment } from '../config/env';

class Logger {
  private isDebugEnabled: boolean;
  private isLoggingEnabled: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDebugEnabled = API_CONFIG.ENABLE_DEBUG;
    this.isLoggingEnabled = API_CONFIG.ENABLE_LOGGING;
    this.isProduction = getEnvironment() === 'production';
  }

  /**
   * Log debug messages - only in development or when explicitly enabled
   */
  debug(...args: any[]): void {
    if (this.isDebugEnabled && !this.isProduction) {
      // console.log('[DEBUG]', ...args);
    }
  }

  /**
   * Log info messages - only when logging is enabled
   */
  info(...args: any[]): void {
    if (this.isLoggingEnabled) {
      console.info('[INFO]', ...args);
    }
  }

  /**
   * Log warning messages - always in development, conditionally in production
   */
  warn(...args: any[]): void {
    if (!this.isProduction || this.isLoggingEnabled) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * Log error messages - always shown but with different levels of detail
   */
  error(...args: any[]): void {
    if (this.isProduction && !this.isLoggingEnabled) {
      // In production with logging disabled, only log the first argument (main error message)
      // This prevents sensitive information from being logged while still showing critical errors
      console.error('[ERROR]', args[0]);
    } else {
      // In development or when logging is enabled, log everything
      console.error('[ERROR]', ...args);
    }
  }

  /**
   * Log critical errors that should always be shown
   */
  critical(...args: any[]): void {
    console.error('[CRITICAL]', ...args);
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export individual methods for easier migration
export const { debug, info, warn, error, critical } = logger;

// Default export
export default logger;
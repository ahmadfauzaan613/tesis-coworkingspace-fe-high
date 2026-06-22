/**
 * Vitest Global Setup
 * Extends jest-dom matchers and cleans up after each test.
 */
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up DOM after every test to avoid state leakage
afterEach(() => {
  cleanup();
});

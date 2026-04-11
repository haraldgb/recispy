import { describe, it, expect } from 'vitest';
import { parseEnv } from '../src/env.js';

describe('parseEnv', () => {
  it('parses a valid env object', () => {
    const env = parseEnv({
      DATABASE_URL: 'postgres://x',
      ANTHROPIC_API_KEY: 'sk-ant-1',
      GOOGLE_CLIENT_ID: 'g.apps.googleusercontent.com',
      JWT_SECRET: 'a'.repeat(32),
      PORT: '8730',
      NODE_ENV: 'development',
      LOG_LEVEL: 'info',
    });
    expect(env.PORT).toBe(8730);
    expect(env.NODE_ENV).toBe('development');
  });

  it('rejects a JWT secret shorter than 32 chars', () => {
    expect(() =>
      parseEnv({
        DATABASE_URL: 'postgres://x',
        ANTHROPIC_API_KEY: 'sk-ant-1',
        GOOGLE_CLIENT_ID: 'g',
        JWT_SECRET: 'short',
        PORT: '8730',
        NODE_ENV: 'development',
        LOG_LEVEL: 'info',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('coerces PORT to number', () => {
    const env = parseEnv({
      DATABASE_URL: 'postgres://x',
      ANTHROPIC_API_KEY: 'sk-ant-1',
      GOOGLE_CLIENT_ID: 'g',
      JWT_SECRET: 'a'.repeat(32),
      PORT: '9000',
      NODE_ENV: 'production',
      LOG_LEVEL: 'warn',
    });
    expect(env.PORT).toBe(9000);
  });
});

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      PORT: string
      DATABASE_URL: string
      JWT_SECRET: string
      JWT_EXPIRES_IN: string
      FRONTEND_URL: string
      BCRYPT_ROUNDS: string
      RATE_LIMIT_WINDOW_MS: string
      RATE_LIMIT_MAX_REQUESTS: string
      SMTP_HOST?: string
      SMTP_PORT?: string
      SMTP_USER?: string
      SMTP_PASS?: string
      TWILIO_ACCOUNT_SID?: string
      TWILIO_AUTH_TOKEN?: string
      TWILIO_PHONE_NUMBER?: string
    }
  }
}

export {}

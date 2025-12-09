export {}; // Ensures the file is treated as a module

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      FS_SERVICE: "local" | "s3";
      // S3 credentials
      S3_ACCESS_KEY_ID
      S3_SECRET_ACCESS_KEY
      S3_REGION
      S3_ENDPOINT
      S3_BUCKET
      S3_SESSION_TOKEN
    }
  }
}

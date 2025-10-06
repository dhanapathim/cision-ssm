import dotenv from 'dotenv';

export default async () => {
  // Load environment variables from .env file
  dotenv.config();

  // Optional: log that it's loaded
  console.log('✅ Environment variables loaded.');
};

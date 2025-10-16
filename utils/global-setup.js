import dotenv from 'dotenv';
import path from 'path';

export default async () => {
  dotenv.config();

  // Optional: log that it's loaded
  console.log('✅ Environment variables loaded.');
};

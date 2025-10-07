import dotenv from 'dotenv';

//export const exe_Time = new Date().toISOString().replace(/[:.]/g, '_');
export const exe_Time = new Date().toISOString().replace(/[:T]/g, '_').split('.')[0];
console.log(exe_Time);
export default async () => {
  // Load environment variables from .env file
  dotenv.config();

  // Optional: log that it's loaded
  console.log('✅ Environment variables loaded.');
};

// Supabase Storage S3-compatible API
// Credentials: S3 Access Keys from Supabase Dashboard → Settings → Storage → S3 Access Keys
// Set in .env: SUPABASE_S3_ACCESS_KEY_ID and SUPABASE_S3_SECRET_ACCESS_KEY (or NEXT_ prefix)
import { custom } from "@better-upload/server/clients";

const accessKeyId = process.env.NEXT_SUPABASE_S3_ACCESS_KEY_ID!;
const secretAccessKey = process.env.NEXT_SUPABASE_S3_SECRET_ACCESS_KEY!;

export const s3 = custom({
  host: `gmwxdoeshvhraelxtmks.storage.supabase.co/storage/v1/s3`,
  accessKeyId,
  secretAccessKey,
  region: "eu-central-1",
  secure: true,
  forcePathStyle: true,
});

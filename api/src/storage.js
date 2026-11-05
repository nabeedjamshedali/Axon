'use strict';
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Returns null when no bucket is configured (e.g. local docker-compose).
function createStorage(env = process.env) {
  if (!env.S3_BUCKET) return null;
  const client = new S3Client({ region: env.AWS_REGION || 'ap-south-1' });
  return {
    putJson: (key, obj) =>
      client.send(new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: JSON.stringify(obj),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
      })),
  };
}

module.exports = { createStorage };

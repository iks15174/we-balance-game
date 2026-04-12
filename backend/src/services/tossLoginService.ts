import https from 'https';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const AIT_API_BASE = 'https://apps-in-toss-api.toss.im';

// AES-256-GCM 복호화 (앱인토스 개인정보 암호화 해제)
function decryptField(encryptedText: string, base64Key: string, aad: string): string {
  const IV_LENGTH = 12;
  const decoded = Buffer.from(encryptedText, 'base64');
  const iv = decoded.subarray(0, IV_LENGTH);
  const tag = decoded.subarray(decoded.length - 16);
  const ciphertext = decoded.subarray(IV_LENGTH, decoded.length - 16);
  const key = Buffer.from(base64Key, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  decipher.setAAD(Buffer.from(aad));
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function createMtlsAgent(): https.Agent {
  const certPath = process.env.AIT_MTLS_CERT_PATH;
  const keyPath = process.env.AIT_MTLS_KEY_PATH;

  if (!certPath || !keyPath) {
    throw new Error('AIT_MTLS_CERT_PATH 또는 AIT_MTLS_KEY_PATH가 설정되지 않았습니다.');
  }

  return new https.Agent({
    cert: readFileSync(resolve(certPath)),
    key: readFileSync(resolve(keyPath)),
  });
}

export async function generateAccessToken(
  authorizationCode: string,
  referrer: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { default: fetch } = await import('node-fetch');
  const agent = createMtlsAgent();

  const response = await fetch(
    `${AIT_API_BASE}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizationCode, referrer }),
      // @ts-ignore node-fetch agent 타입
      agent,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`토큰 발급 실패: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    resultType: string;
    success: { accessToken: string; refreshToken: string } | null;
    error?: { errorCode: string; reason: string };
  };

  if (data.resultType !== 'SUCCESS' || !data.success) {
    throw new Error(`토큰 발급 실패: ${data.error?.errorCode} ${data.error?.reason}`);
  }
  return data.success;
}

export async function getLoginMe(accessToken: string): Promise<{ userKey: string; name: string | null }> {
  const { default: fetch } = await import('node-fetch');
  const agent = createMtlsAgent();

  const response = await fetch(
    `${AIT_API_BASE}/api-partner/v1/apps-in-toss/user/oauth2/login-me`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      // @ts-ignore node-fetch agent 타입
      agent,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`사용자 정보 조회 실패: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    resultType: string;
    success: { userKey: number; name?: string } | null;
    error?: { errorCode: string; reason: string };
  };

  if (data.resultType !== 'SUCCESS' || !data.success) {
    throw new Error(`사용자 정보 조회 실패: ${data.error?.errorCode} ${data.error?.reason}`);
  }

  const userKey = String(data.success.userKey);

  // name 복호화 (AIT_DECRYPT_KEY, AIT_DECRYPT_AAD 미설정 시 null)
  let name: string | null = null;
  const decryptKey = process.env.AIT_DECRYPT_KEY;
  const decryptAad = process.env.AIT_DECRYPT_AAD;
  if (data.success.name && decryptKey && decryptAad) {
    try {
      name = decryptField(data.success.name, decryptKey, decryptAad);
    } catch (e) {
      console.warn('name 복호화 실패:', e);
    }
  }

  return { userKey, name };
}

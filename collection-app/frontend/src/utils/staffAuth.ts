export async function generateSignature(
  payload: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getStaffAuthHeaders(
  body = "",
): Promise<Record<string, string>> {
  const apiKey = process.env.NEXT_PUBLIC_STAFF_API_KEY?.trim();
  const secretKey = process.env.NEXT_PUBLIC_STAFF_SECRET_KEY?.trim();

  if (!apiKey || !secretKey) {
    throw new Error("Staff API credentials are not configured");
  }

  return {
    "x-api-key": apiKey,
    "x-signature": await generateSignature(body, secretKey),
  };
}

import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

async function testSign() {
  const secret = "MonSuperSecretPrezta2026";
  const body = '{"test":"data"}';

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  console.log("Calculated Signature:", expectedSignature);
}

testSign();

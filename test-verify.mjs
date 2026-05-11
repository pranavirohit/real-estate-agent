/**
 * Smoke test: POST /verify with minimal JPEG + livePhoto — expects biometricVerification in body.
 * Run with backend: npm run dev (port 8080)
 */
const minimalJpeg =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

async function testVerify() {
  const url = "http://127.0.0.1:8080/verify";
  const body = {
    imageBase64: `data:image/jpeg;base64,${minimalJpeg}`,
    livePhotoBase64: `data:image/jpeg;base64,${minimalJpeg}`,
    requestedAttributes: [],
  };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    console.log("Response status:", response.status);
    const preview = { ...data };
    if (preview.message && typeof preview.message === "string") {
      preview.message =
        preview.message.slice(0, 120) +
        (preview.message.length > 120 ? "…" : "");
    }
    console.log("Response body (truncated message):", JSON.stringify(preview, null, 2));

    if (data.biometricVerification) {
      console.log("\n✓ Response includes biometricVerification");
      console.log("  - faceMatch:", data.biometricVerification.faceMatch);
      console.log("  - confidence:", data.biometricVerification.confidence);
      console.log(
        "  - error:",
        data.biometricVerification.error || "none"
      );
      if (data.message && String(data.message).includes("bio:")) {
        console.log("\n✓ Signed message includes bio: block");
      } else {
        console.log("\n⚠ message may not include bio: (check full message)");
      }
    } else {
      console.log("\n✗ Response MISSING biometricVerification");
    }
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testVerify();

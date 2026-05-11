/**
 * Face match (ID portrait vs live selfie) using @vladmandic/face-api + TensorFlow.js WASM.
 * Avoids @tensorflow/tfjs-node (native build) for Windows/dev friendliness.
 */

import path from 'path';
import { createCanvas, loadImage, type Image } from 'canvas';

/** Resolve bundled models from project root (cwd), not __dirname — works with ts-node / Docker. */
function projectRoot(): string {
  return process.cwd();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FaceApiModule = any;

let faceapi: FaceApiModule | null = null;
let engineReady = false;

const DISTANCE_THRESHOLD = 0.6;

export type FaceMatchResult = {
  match: boolean;
  confidence: number;
  error?: string;
};

export async function ensureFaceEngine(): Promise<boolean> {
  if (engineReady && faceapi) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tf = require('@tensorflow/tfjs') as typeof import('@tensorflow/tfjs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const wasm = require('@tensorflow/tfjs-backend-wasm') as typeof import('@tensorflow/tfjs-backend-wasm');
    const wasmDir =
      path.join(
        projectRoot(),
        'node_modules/@tensorflow/tfjs-backend-wasm/dist'
      ) + path.sep;
    wasm.setWasmPaths(wasmDir);
    await tf.setBackend('wasm');
    await tf.ready();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');
    const modelDir = path.join(
      projectRoot(),
      'node_modules/@vladmandic/face-api/model'
    );
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelDir);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelDir);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelDir);
    engineReady = true;
    return true;
  } catch (e) {
    console.error('Face engine init failed:', e);
    engineReady = false;
    faceapi = null;
    return false;
  }
}

function stripDataUrl(b64: string): string {
  return b64.replace(/^data:image\/\w+;base64,/, '').replace(/\s/g, '');
}

/** Heuristic crop: typical US DL photo region (POC). */
export async function extractIdPhoto(
  documentImageBase64: string
): Promise<string | null> {
  try {
    const stripped = stripDataUrl(documentImageBase64);
    const buffer = Buffer.from(stripped, 'base64');
    const img = await loadImage(buffer);
    const fullCanvas = createCanvas(img.width, img.height);
    const ctx = fullCanvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img as Image, 0, 0);

    const photoWidth = Math.floor(img.width * 0.35);
    const photoHeight = Math.floor(img.height * 0.4);
    const photoX = Math.floor(img.width * 0.05);
    const photoY = Math.floor(img.height * 0.28);

    const photoCanvas = createCanvas(photoWidth, photoHeight);
    const pctx = photoCanvas.getContext('2d');
    if (!pctx) return null;
    pctx.drawImage(
      fullCanvas as unknown as Image,
      photoX,
      photoY,
      photoWidth,
      photoHeight,
      0,
      0,
      photoWidth,
      photoHeight
    );

    return photoCanvas.toDataURL('image/jpeg', 0.92);
  } catch (e) {
    console.error('extractIdPhoto:', e);
    return null;
  }
}

export async function compareFaces(
  idPhotoBase64: string,
  livePhotoBase64: string
): Promise<FaceMatchResult> {
  if (!faceapi || !engineReady) {
    return {
      match: false,
      confidence: 0,
      error: 'Face detection models not loaded',
    };
  }

  try {
    const idBuf = Buffer.from(stripDataUrl(idPhotoBase64), 'base64');
    const liveBuf = Buffer.from(stripDataUrl(livePhotoBase64), 'base64');
    const idImg = await loadImage(idBuf);
    const liveImg = await loadImage(liveBuf);

    const opts = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.45,
    });

    const idDetection = await faceapi
      .detectSingleFace(idImg as Image, opts)
      .withFaceLandmarks()
      .withFaceDescriptor();

    const liveDetection = await faceapi
      .detectSingleFace(liveImg as Image, opts)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!idDetection || !liveDetection) {
      return {
        match: false,
        confidence: 0,
        error: 'Could not detect a face in one or both images',
      };
    }

    const distance = faceapi.euclideanDistance(
      idDetection.descriptor,
      liveDetection.descriptor
    );
    const match = distance < DISTANCE_THRESHOLD;
    const confidence = Math.max(0, Math.min(1, 1 - distance));

    return {
      match,
      confidence: parseFloat(confidence.toFixed(4)),
    };
  } catch (e) {
    console.error('Face comparison error:', e);
    return {
      match: false,
      confidence: 0,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

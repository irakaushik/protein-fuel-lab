import { handleWebScanRequest } from "../src/server/scan-handler.js";

export async function POST(request) {
  return handleWebScanRequest(request);
}

export async function GET(request) {
  return handleWebScanRequest(request);
}

const OPENAI_URL = "https://api.openai.com/v1/responses";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function sanitizeMacro(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return 0;
  }

  return Math.round(normalized);
}

function sumMacros(items) {
  return items.reduce(
    (sum, item) => ({
      protein: sum.protein + item.protein,
      calories: sum.calories + item.calories,
      carbs: sum.carbs + item.carbs,
      fats: sum.fats + item.fats,
    }),
    { protein: 0, calories: 0, carbs: 0, fats: 0 },
  );
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputs = Array.isArray(payload.output) ? payload.output : [];
  for (const output of outputs) {
    const content = Array.isArray(output.content) ? output.content : [];
    for (const block of content) {
      if (typeof block.text === "string" && block.text.trim()) {
        return block.text.trim();
      }
    }
  }

  throw new Error("No structured scan result came back from the model.");
}

function normalizeScanResult(payload) {
  const items = Array.isArray(payload.items)
    ? payload.items
      .map((item) => ({
        name: String(item?.name ?? "").trim(),
        protein: sanitizeMacro(item?.protein),
        calories: sanitizeMacro(item?.calories),
        carbs: sanitizeMacro(item?.carbs),
        fats: sanitizeMacro(item?.fats),
      }))
      .filter((item) => item.name)
    : [];

  if (!items.length) {
    throw new Error("The scan did not return any meal items.");
  }

  const totals = payload?.totals && typeof payload.totals === "object"
    ? {
      protein: sanitizeMacro(payload.totals.protein),
      calories: sanitizeMacro(payload.totals.calories),
      carbs: sanitizeMacro(payload.totals.carbs),
      fats: sanitizeMacro(payload.totals.fats),
    }
    : sumMacros(items);

  const allowedConfidence = new Set(["High confidence", "Medium confidence", "Low confidence"]);

  return {
    id: "scan-upload",
    title: String(payload?.title || "Scanned meal").trim() || "Scanned meal",
    caption: String(payload?.caption || items.map((item) => item.name).join(", ")).trim(),
    confidence: allowedConfidence.has(payload?.confidence) ? payload.confidence : "Medium confidence",
    disclaimer: "Estimates may vary",
    items,
    totals,
  };
}

export async function analyzeMealImage({
  imageBase64,
  mimeType,
  fileName,
  apiKey,
  fetchImpl = globalThis.fetch,
  model = "gpt-4o",
}) {
  if (!apiKey) {
    throw new Error("Scan API is not configured. Add OPENAI_API_KEY to enable meal analysis.");
  }

  const response = await fetchImpl(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are a nutrition estimation assistant for a protein-first food log.",
                "Analyze a single meal image and estimate the most likely food items and macros.",
                "Return only valid JSON with keys: title, caption, confidence, items, totals.",
                "confidence must be one of: High confidence, Medium confidence, Low confidence.",
                "items must be an array of objects with name, protein, calories, carbs, fats.",
                "totals must include protein, calories, carbs, fats.",
                "Prefer common Indian meal names when the dish appears Indian.",
                "Use integers for all macro values.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Analyze this meal image${fileName ? ` named ${fileName}` : ""}.`,
            },
            {
              type: "input_image",
              image_url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
            },
          ],
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || "The AI scan request failed.");
  }

  return normalizeScanResult(JSON.parse(extractOutputText(payload)));
}

export async function handleWebScanRequest(request, apiKey = process.env.OPENAI_API_KEY) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  if (!payload?.imageBase64) {
    return jsonResponse({ error: "Missing image payload." }, 400);
  }

  try {
    const result = await analyzeMealImage({
      imageBase64: payload.imageBase64,
      mimeType: payload.mimeType,
      fileName: payload.fileName,
      apiKey,
    });

    return jsonResponse(result, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze this meal image.";
    const status = message.includes("not configured") ? 503 : 500;
    return jsonResponse({ error: message }, status);
  }
}

export async function handleNodeScanRequest(req, res) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });

  const response = await handleWebScanRequest(request);
  const headers = Object.fromEntries(response.headers.entries());
  res.writeHead(response.status, headers);
  res.end(await response.text());
}

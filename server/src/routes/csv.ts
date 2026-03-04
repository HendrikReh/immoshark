import { Router } from "express";
import multer from "multer";
import { csvColumnMappingSchema } from "@immoshark/shared";
import { parseCsvContent, importCsvData } from "../services/csv.service.js";
import { validate } from "../middleware/validate.js";
import { suggestMapping } from "../services/mapping.service.js";

export const csvRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Store uploaded CSV in memory for the import step
export const csvStore = new Map<string, string>();

// POST /api/csv/upload — upload CSV, return headers + preview
csvRouter.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { message: "Keine Datei hochgeladen", code: "NO_FILE" } });
    return;
  }

  const content = req.file.buffer.toString("utf-8");
  const result = parseCsvContent(content);

  // Store with a simple session key
  const sessionId = crypto.randomUUID();
  csvStore.set(sessionId, content);

  // Clean up after 10 minutes
  setTimeout(() => csvStore.delete(sessionId), 10 * 60 * 1000);

  res.json({ data: { ...result, session_id: sessionId } });
});

// POST /api/csv/suggest-mapping — LLM-based column mapping suggestion
csvRouter.post("/suggest-mapping", async (req, res) => {
  const { session_id } = req.body;

  if (!session_id || !csvStore.has(session_id)) {
    res.status(400).json({
      error: { message: "CSV-Session nicht gefunden. Bitte erneut hochladen.", code: "SESSION_NOT_FOUND" },
    });
    return;
  }

  const content = csvStore.get(session_id)!;
  const { headers, preview } = parseCsvContent(content);

  try {
    const mapping = await suggestMapping(headers, preview);
    if (!mapping) {
      res.status(502).json({
        error: { message: "KI-Mapping konnte nicht verarbeitet werden", code: "LLM_ERROR" },
      });
      return;
    }
    res.json({ data: { mapping, source: "llm" } });
  } catch (e) {
    res.status(502).json({
      error: { message: "KI-Dienst nicht erreichbar", code: "LLM_ERROR" },
    });
  }
});

// POST /api/csv/import — import with column mapping
csvRouter.post("/import", (req, res) => {
  const { session_id, mapping } = req.body;

  if (!session_id || !csvStore.has(session_id)) {
    res.status(400).json({
      error: { message: "CSV-Session nicht gefunden. Bitte erneut hochladen.", code: "SESSION_NOT_FOUND" },
    });
    return;
  }

  const parsedMapping = csvColumnMappingSchema.safeParse(mapping);
  if (!parsedMapping.success) {
    res.status(400).json({
      error: { message: "Ungültiges Spalten-Mapping", code: "INVALID_MAPPING" },
    });
    return;
  }

  const content = csvStore.get(session_id)!;
  const result = importCsvData(content, parsedMapping.data);

  csvStore.delete(session_id);

  res.json({ data: result });
});

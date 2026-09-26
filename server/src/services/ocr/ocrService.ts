import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { config } from '../../config/env.js';

export interface IOCRService {
  extractText(filePath: string, mimeType: string): Promise<string>;
}

export class HybridOCRService implements IOCRService {
  async extractText(filePath: string, mimeType: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Document file not found at path: ${filePath}`);
    }

    try {
      // 1. PDF Direct Parsing
      if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        if (pdfData.text && pdfData.text.trim().length > 20) {
          return pdfData.text.trim();
        }
        // If PDF contains only scanned raster images, fall through to OCR
      }

      // 2. Images or Scanned PDFs: Tesseract OCR Engine
      if (config.ocrEngine === 'tesseract') {
        const worker = await createWorker('eng');
        const ret = await worker.recognize(filePath);
        await worker.terminate();
        return ret.data.text.trim();
      }

      // Fallback when Tesseract OCR engine is set to mock or disabled
      const filename = path.basename(filePath);
      return `[Demo Text Extraction] Preview content for ${filename}.\nNo deep optical characters scanned. Configure Tesseract OCR or Gemini Vision to extract full document text.`;
    } catch (err: any) {
      console.warn(`[OCR] Error extracting text from ${filePath}:`, err.message);
      return `[Text Extraction Note] Could not parse raw text from ${path.basename(filePath)} (${err.message}).`;
    }
  }
}

export const ocrService = new HybridOCRService();

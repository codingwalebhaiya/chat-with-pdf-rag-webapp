// src/utils/pdfParser.ts
import * as pdfParse from 'pdf-parse';

export class PDFParser {
  static async parseBuffer(buffer: Buffer): Promise<{
    text: string;
    numpages: number;
    info: any;
    metadata: any;
  }> {
    try {
      const data = await pdfParse(buffer);
      return {
        text: data.text,
        numpages: data.numpages,
        info: data.info,
        metadata: data.metadata,
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error}`);
    }
  }

  static async extractTextByPages(buffer: Buffer): Promise<Array<{
    pageNumber: number;
    text: string;
  }>> {
    const data = await this.parseBuffer(buffer);
    const pages: Array<{ pageNumber: number; text: string }> = [];
    
    // Split text by page (assuming each page ends with form feed character)
    const pageTexts = data.text.split('\f');
    
    for (let i = 0; i < Math.min(pageTexts.length, data.numpages); i++) {
      pages.push({
        pageNumber: i + 1,
        text: pageTexts[i].trim(),
      });
    }
    
    return pages;
  }
}
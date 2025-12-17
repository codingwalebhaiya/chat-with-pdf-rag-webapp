// src/utils/textSplitter.ts
export class TextSplitter {
  static splitText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      
      // If we're not at the end of the text, try to break at a sentence boundary
      if (end < text.length) {
        // Look for sentence endings (. ! ?) followed by space
        const sentenceEnd = text.lastIndexOf('.', end);
        const questionEnd = text.lastIndexOf('?', end);
        const exclamationEnd = text.lastIndexOf('!', end);
        
        const lastBreak = Math.max(sentenceEnd, questionEnd, exclamationEnd);
        
        if (lastBreak > start + chunkSize * 0.5) {
          end = lastBreak + 1;
        }
      }
      
      const chunk = text.substring(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      start = end - overlap;
      
      // Prevent infinite loop
      if (start >= text.length) break;
    }
    
    return chunks;
  }

  static splitByPages(pages: Array<{ pageNumber: number; text: string }>): Array<{
    pageNumber: number;
    content: string;
    chunkIndex: number;
  }> {
    const chunks: Array<{ pageNumber: number; content: string; chunkIndex: number }> = [];
    
    for (const page of pages) {
      const pageChunks = this.splitText(page.text);
      
      pageChunks.forEach((chunk, index) => {
        chunks.push({
          pageNumber: page.pageNumber,
          content: chunk,
          chunkIndex: index,
        });
      });
    }
    
    return chunks;
  }
}
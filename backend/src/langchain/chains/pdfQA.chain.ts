// backend/src/langchain/chains/pdfQA.chain.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { PrismaVectorStore } from "../vectorstores/pgvector.store";

export class PDFQAChain {
  private model: ChatGoogleGenerativeAI;
  private vectorStore: PrismaVectorStore;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-pro",
      temperature: 0.7,
    });
    
    this.vectorStore = new PrismaVectorStore();
  }

  async createChain(pdfId: string) {
    // Retrieve relevant documents
    const retriever = await this.vectorStore.asRetriever(pdfId, {
      k: 4, // Number of chunks to retrieve
    });

    // Create prompt template
    const prompt = PromptTemplate.fromTemplate(`
      You are an AI assistant specialized in answering questions about PDF documents.
      Use the following context from the PDF to answer the question.
      If the answer cannot be found in the context, say "I cannot find this information in the document."
      
      Context: {context}
      
      Question: {question}
      
      Answer:`
    );

    // Create chain
    const chain = RunnableSequence.from([
      {
        context: retriever.pipe(this.formatDocuments),
        question: new RunnablePassthrough(),
      },
      prompt,
      this.model,
      new StringOutputParser(),
    ]);

    return chain;
  }

  private formatDocuments(docs: any[]): string {
    return docs.map(doc => doc.pageContent).join("\n\n");
  }
}
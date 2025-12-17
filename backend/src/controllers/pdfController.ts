// src/controllers/pdf.controller.ts
import { Request, Response } from "express";
import { PDFService } from "../services/pdfService.js"
import { ApiResponse, AuthRequest } from "../types/index.js";

export class PDFController {
  // Upload PDF
  static async uploadPDF(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        const response: ApiResponse = {
          success: false,
          message: "No file uploaded",
        };
        res.status(400).json(response);
        return;
      }

      const userId = req.user!.userId;
      const result = await PDFService.uploadPDF(userId, req.file);

      const response: ApiResponse = {
        success: true,
        message: "PDF uploaded successfully",
        data: result,
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(500).json(response);
    }
  }

  // Get user's PDFs
  static async getPDFs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const pdfs = await PDFService.getUserPDFs(userId);

      const response: ApiResponse = {
        success: true,
        message: "PDFs retrieved successfully",
        data: pdfs,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(500).json(response);
    }
  }

  // Get PDF by ID
  static async getPDF(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

       if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'ID is required',
        };
        res.status(400).json(response);
        return;
      }

      const pdf = await PDFService.getPDFById(userId, id);

      const response: ApiResponse = {
        success: true,
        message: "PDF retrieved successfully",
        data: pdf,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(404).json(response);
    }
  }

  // Delete PDF
  static async deletePDF(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'ID is required',
        };
        res.status(400).json(response);
        return;
      }
      const result = await PDFService.deletePDF(userId, id);

      const response: ApiResponse = {
        success: true,
        message: "PDF deleted successfully",
        data: result,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(404).json(response);
    }
  }
}

import React, { useState } from "react";
import axios from "axios";
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Loader2, Upload } from "lucide-react";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const UploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return alert("Select a file");

    if (!ALLOWED_TYPES.includes(file.type)) {
      return alert("Only PDF, DOC, and DOCX files are allowed");
    }

    if (file.size > MAX_FILE_SIZE) {
      return alert("Max file size is 10MB");
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/upload`,
        formData
      );
      alert("Uploaded & indexed!");
      setFile(null);
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Upload Document
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />

            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadForm;

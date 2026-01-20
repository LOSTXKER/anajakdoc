"use client";

import { Upload, Sparkles } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  return (
    <div className="rounded-xl border-2 border-dashed bg-white p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all">
      <label className="cursor-pointer block">
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <div className="text-lg font-medium text-gray-700 mb-1">
          ลากไฟล์มาวาง หรือ คลิกเลือก
        </div>
        <p className="text-sm text-gray-500 mb-4">
          รองรับ: รูปภาพ, PDF
        </p>
        <div className="inline-flex items-center gap-2 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          AI จะอ่านและจัดการให้อัตโนมัติ
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          onChange={onFileSelect}
          className="hidden"
        />
      </label>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";

export interface ValidationPreviewProps {
  file?: File | null;
}

// 1️⃣ NAMED EXPORT (using the "export" keyword before function)
export function ValidationPreview({ file }: ValidationPreviewProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);

  useEffect(() => {
    if (!file) {
      setHeaders([]);
      setPreviewRows([]);
      return;
    }

    const readPreview = async () => {
      try {
        const text = await file.text();
        const lines = text
          .split(/\r\n|\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (lines.length > 0) {
          const parseRow = (line: string): string[] => {
            const cols: string[] = [];
            let current = "";
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === "," && !inQuotes) {
                cols.push(current.trim());
                current = "";
              } else {
                current += char;
              }
            }
            cols.push(current.trim());
            return cols;
          };

          setHeaders(parseRow(lines[0]));
          setPreviewRows(lines.slice(1, 6).map((line) => parseRow(line)));
        }
      } catch (err) {
        console.error("Failed to read preview file:", err);
      }
    };

    readPreview();
  }, [file]);

  if (!file) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
        No file selected for preview.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-2 font-medium text-gray-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {previewRows.length === 0 ? (
            <tr>
              <td colSpan={headers.length || 1} className="px-4 py-3 text-center text-gray-500">
                No preview data available.
              </td>
            </tr>
          ) : (
            previewRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-50">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2 text-gray-600">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// 2️⃣ DEFAULT EXPORT at the bottom
export default ValidationPreview;

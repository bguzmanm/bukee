// typescript
// File: src/components/EpubDrop.tsx
import React, { useCallback, useState } from "react";
import { saveEpubFile } from "@/lib/tauri"; // asegúrate de exportar esta función

type Props = {
    onUploaded?: (remotePath: string) => void; // se llama cuando el archivo se guarda
};

export default function EpubDrop({ onUploaded }: Props) {
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        const dt = e.dataTransfer;
        if (!dt || !dt.files || dt.files.length === 0) {
            console.debug("No files in drop");
            return;
        }

        const file = dt.files[0];
        if (!file.name.toLowerCase().endsWith(".epub")) {
            console.debug("Ignored non-epub:", file.name);
            return;
        }

        try {
            setLoading(true);
            console.debug("Reading file", file.name);
            const buffer = await file.arrayBuffer();
            const u8 = new Uint8Array(buffer);

            // Llamada al comando Rust. saveEpubFile debe recibir (fileName, Uint8Array)
            const result = await saveEpubFile(file.name, u8);
            console.debug("saveEpubFile result:", result);

            if (onUploaded) onUploaded(result);
        } catch (err) {
            console.error("Error uploading epub:", err);
            // muestra UI de error si tienes un toast/modal
        } finally {
            setLoading(false);
        }
    }, [onUploaded]);

    return (
        <div
            onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    style={{
        border: "2px dashed #888",
            padding: 24,
            borderRadius: 8,
            background: dragOver ? "#f0f7ff" : "transparent",
            textAlign: "center",
            cursor: "copy",
            opacity: loading ? 0.6 : 1,
    }}
>
    {loading ? "Subiendo..." : "Arrastra aquí tu archivo .epub o haz click para seleccionar"}
    <input
        type="file"
    accept=".epub"
    style={{ display: "none" }}
    onChange={async (e) => {
        const f = e.currentTarget.files?.[0];
        if (!f) return;
        // reutiliza la misma lógica de drop
        const buffer = await f.arrayBuffer();
        const u8 = new Uint8Array(buffer);
        setLoading(true);
        try {
            const result = await saveEpubFile(f.name, u8);
            if (onUploaded) onUploaded(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }}
    />
    </div>
);
}
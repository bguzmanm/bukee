import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";

interface DragDropOverlayProps {
  isDragging: boolean;
}

export function DragDropOverlay({ isDragging }: DragDropOverlayProps) {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-primary border-dashed m-4 rounded-xl"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-primary"
          >
            <div className="p-6 bg-primary/10 rounded-full">
              <Upload className="w-16 h-16" />
            </div>
            <h2 className="text-3xl font-bold">Drop EPUB here</h2>
            <p className="text-muted-foreground text-lg">
              Well extract the metadata for you
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
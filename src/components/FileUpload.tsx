import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  bucket: string;
  folder: string;
  label: string;
  accept?: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}

export function FileUpload({ bucket, folder, label, accept = "image/*", currentUrl, onUploaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    // For private buckets, use signed URL; for public, use public URL
    if (bucket === "client-documents") {
      const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
      if (signedData?.signedUrl) {
        onUploaded(signedData.signedUrl);
      }
    } else {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      onUploaded(urlData.publicUrl);
    }
    toast.success(`${label} uploaded!`);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {currentUrl ? (
          <div className="flex items-center gap-2 text-sm text-success">
            <Check className="h-4 w-4" />
            <span>{label} uploaded</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No {label.toLowerCase()} yet</span>
        )}
      </div>
      {currentUrl && (
        <img src={currentUrl} alt={label} className="h-20 w-20 rounded-lg object-cover border" />
      )}
      <label className="cursor-pointer">
        <Button variant="outline" size="sm" disabled={uploading} asChild>
          <span>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? "Uploading..." : `Upload ${label}`}
          </span>
        </Button>
        <input type="file" accept={accept} onChange={handleUpload} className="hidden" />
      </label>
    </div>
  );
}

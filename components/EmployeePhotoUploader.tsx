"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { getApiBaseUrl } from "../lib/api";

const maxPhotoSizeBytes = 2 * 1024 * 1024;

type EmployeePhotoUploaderProps = {
  employeeId: string;
  currentPhotoUrl?: string;
};

export function EmployeePhotoUploader({
  employeeId,
  currentPhotoUrl
}: EmployeePhotoUploaderProps) {
  const router = useRouter();
  const [draftUrl, setDraftUrl] = useState(currentPhotoUrl ?? "");
  const [fileName, setFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const hasChange = (draftUrl ?? "") !== (currentPhotoUrl ?? "");

  const onSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    setError("");
    setNotice("");

    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (selected.size > maxPhotoSizeBytes) {
      setError("Image must be 2MB or less.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setDraftUrl(result);
      setFileName(selected.name);
      setNotice("Photo selected. Click Save Photo to apply.");
    };
    reader.onerror = () => {
      setError("Could not read the selected image.");
    };
    reader.readAsDataURL(selected);
  };

  const persistPhoto = async (photoUrl: string) => {
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ profilePhotoUrl: photoUrl })
      });

      if (!response.ok) {
        throw new Error(`Failed to save employee photo (${response.status})`);
      }

      setNotice(photoUrl ? "Employee photo updated." : "Employee photo removed.");
      setFileName(photoUrl ? fileName : "");
      router.refresh();
    } catch {
      setError("Unable to save photo right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="employee-photo-uploader">
      <label className="employee-photo-input">
        <input type="file" accept="image/*" onChange={onSelectFile} />
        <span>{fileName ? "Change photo" : "Upload photo"}</span>
      </label>
      <button
        type="button"
        className="employee-photo-save"
        disabled={!hasChange || isSaving}
        onClick={() => void persistPhoto(draftUrl)}
      >
        {isSaving ? "Saving..." : "Save Photo"}
      </button>
      <button
        type="button"
        className="employee-photo-remove"
        disabled={(!draftUrl && !currentPhotoUrl) || isSaving}
        onClick={() => {
          setDraftUrl("");
          setFileName("");
          void persistPhoto("");
        }}
      >
        Remove
      </button>
      {error ? <p className="employee-photo-message error">{error}</p> : null}
      {notice ? <p className="employee-photo-message">{notice}</p> : null}
    </div>
  );
}


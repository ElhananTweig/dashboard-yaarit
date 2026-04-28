"use client";

import { CheckIcon } from "./icons";

interface ToastProps {
  message: string;
  show: boolean;
}

export default function Toast({ message, show }: ToastProps) {
  return (
    <div className={`toast${show ? " show" : ""}`} role="status" aria-live="polite">
      <span className="check">
        <CheckIcon />
      </span>
      <span>{message}</span>
    </div>
  );
}

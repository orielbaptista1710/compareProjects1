//frontend-vite\src\pages\DeveloperDashboard\DeveloperDashboardComponents\DevPropertyList\DeleteDialog.jsx
import { useEffect, memo } from "react";
import { useEscapeKey } from "../../../../hooks/useEscapeKey";

const DeleteDialog = memo(({ open, title, onConfirm, onCancel }) => {
  
  // Lock body scroll while open
  useEffect(() => {
  if (!open) return;
  const previous = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = previous; };
}, [open]);

  // Close on Escape
  useEscapeKey(open, onCancel);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div
        className="dialog-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="dialog-title" className="dialog-title">Delete property?</h3>
        <p className="dialog-body">
          <strong>"{title}"</strong> will be permanently deleted. This cannot be undone.
        </p>
        <div className="dialog-actions">
          <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn--danger" onClick={onConfirm} autoFocus>Delete</button>
        </div>
      </div>
    </div>
  );
});

DeleteDialog.displayName = "DeleteDialog";

export default DeleteDialog;
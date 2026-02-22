"""
Snippet to add to your FastAPI backend (Databricks) so the frontend can preview
documents stored in the volume.

Frontend calls: GET /api/cases/{case_id}/files/{filename}

Instructions:
  1. Copy the two helpers (_sanitize_filename, _sanitize_case_id) and the route
     get_case_file into your main FastAPI app file (where `app` and VOLUME_PATH are defined).
  2. Ensure VOLUME_PATH matches your upload path (e.g. "/Volumes/nyusw/buildathon/rag_pdfs").
  3. DATABRICKS_HOST and DATABRICKS_TOKEN must be set (same as upload).
"""

import os
import re
import logging
from fastapi import HTTPException
from fastapi.responses import Response

log = logging.getLogger(__name__)


def _sanitize_filename(name: str) -> str:
    """Basename only, alphanumeric, dash, underscore, dot, space. No path traversal."""
    if not name or not name.strip():
        raise ValueError("filename required")
    base = name.strip().split("/")[-1].split("\\")[-1]
    if not re.match(r"^[a-zA-Z0-9._\- ]+$", base):
        raise ValueError("filename contains invalid characters")
    return base


def _sanitize_case_id(case_id: str) -> str:
    """Non-empty, safe for path (e.g. 6-digit numeric)."""
    if not case_id or not str(case_id).strip():
        raise ValueError("case_id required")
    cid = str(case_id).strip()
    if not re.match(r"^[a-zA-Z0-9-]+$", cid):
        raise ValueError("case_id contains invalid characters")
    return cid


# Add this route to your FastAPI app (after your existing routes):

@app.get("/api/cases/{case_id}/files/{filename}")
def get_case_file(case_id: str, filename: str):
    """Stream a file from the Databricks volume for preview. case_id + filename must match the path used at upload."""
    try:
        cid = _sanitize_case_id(case_id)
        fname = _sanitize_filename(filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    host = os.getenv("DATABRICKS_HOST")
    token = os.getenv("DATABRICKS_TOKEN")
    if not host or not token:
        raise HTTPException(status_code=500, detail="Databricks not configured")

    vol_path = f"{VOLUME_PATH}/{cid}/{fname}"

    try:
        from databricks.sdk import WorkspaceClient

        w = WorkspaceClient(host=host, token=token)
        content = w.files.download(vol_path)
        # content may be bytes or a stream-like; normalize to bytes if needed
        if hasattr(content, "read"):
            body = content.read()
        else:
            body = content
        if not body:
            raise HTTPException(status_code=404, detail="File not found or empty")
    except Exception as e:
        log.exception("Volume download failed for %s", vol_path)
        if "not found" in str(e).lower() or "404" in str(e):
            raise HTTPException(status_code=404, detail="File not found")
        raise HTTPException(status_code=500, detail="Failed to download file")

    ext = fname.rsplit(".", 1)[-1].lower() if "." in fname else ""
    media_type = "application/pdf" if ext == "pdf" else "application/octet-stream"
    return Response(
        content=body,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{fname}"',
        },
    )

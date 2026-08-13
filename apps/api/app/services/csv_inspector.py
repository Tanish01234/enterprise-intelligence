"""CSV Inspector Service

Inspects uploaded CSV files, detects delimiters, parses sample rows,
and infers column schemas/types.
"""

import csv
import io
from typing import Any
from app.modules.datamart.schemas import ColumnMetadata, SchemaDetectionResult


def infer_type(val: str) -> str:
    """Infer primitive Python/SQL type from string value."""
    val = val.strip()
    if not val:
        return "string"
    
    # Check int
    try:
        int(val)
        return "integer"
    except ValueError:
        pass

    # Check float
    try:
        float(val)
        return "float"
    except ValueError:
        pass

    # Check date (YYYY-MM-DD, YYYY/MM/DD, etc.)
    if len(val) in (10, 19, 24):
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
            try:
                from datetime import datetime
                datetime.strptime(val[:19], fmt if len(val) >= 19 else fmt[:8])
                return "date"
            except ValueError:
                pass

    # Check boolean
    if val.lower() in ("true", "false", "t", "f", "1", "0", "yes", "no"):
        return "boolean"

    return "string"


def detect_delimiter(content_sample: str) -> str:
    """Detect CSV delimiter from content sample."""
    try:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(content_sample, delimiters=[",", ";", "\t", "|"])
        return dialect.delimiter
    except Exception:
        # Fallback heuristic
        first_line = content_sample.splitlines()[0] if content_sample else ""
        for d in [",", ";", "\t", "|"]:
            if d in first_line:
                return d
        return ","


def inspect_csv_bytes(file_bytes: bytes, filename: str, sample_row_limit: int = 50) -> SchemaDetectionResult:
    """Inspect CSV binary content, detect columns, delimiter, and infer column types."""
    # Decode sample text
    text_content = file_bytes.decode("utf-8", errors="replace")
    delimiter = detect_delimiter(text_content[:2048])

    stream = io.StringIO(text_content)
    reader = csv.reader(stream, delimiter=delimiter)

    rows = []
    try:
        headers = next(reader)
    except StopIteration:
        headers = []

    for row in reader:
        rows.append(row)
        if len(rows) >= sample_row_limit:
            break

    total_rows = len(rows) + (1 if headers else 0)
    # Estimate total rows if large content
    line_count = text_content.count("\n")
    if line_count > total_rows:
        total_rows = line_count

    columns: list[ColumnMetadata] = []

    for idx, header in enumerate(headers):
        clean_header = header.strip() or f"column_{idx+1}"
        col_values = [r[idx] for r in rows if idx < len(r)]

        # Determine type by inspecting sample non-empty values
        non_empty = [v for v in col_values if v and v.strip()]
        null_count = len(col_values) - len(non_empty)

        inferred = "string"
        if non_empty:
            types = [infer_type(v) for v in non_empty[:20]]
            # Pick most specific common type
            if all(t == "integer" for t in types):
                inferred = "integer"
            elif all(t in ("integer", "float") for t in types):
                inferred = "float"
            elif all(t == "date" for t in types):
                inferred = "date"
            elif all(t == "boolean" for t in types):
                inferred = "boolean"

        sample_vals = non_empty[:5]

        columns.append(
            ColumnMetadata(
                name=clean_header,
                inferred_type=inferred,
                sample_values=sample_vals,
                null_count=null_count,
            )
        )

    return SchemaDetectionResult(
        filename=filename,
        delimiter=delimiter,
        row_count=total_rows,
        column_count=len(headers),
        columns=columns,
    )

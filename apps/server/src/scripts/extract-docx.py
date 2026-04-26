#!/usr/bin/env python
"""Extract structured content (paragraphs + tables) from the BTS-Vol 6 docx."""
import sys
from pathlib import Path
from docx import Document

src = Path(sys.argv[1])
out = Path(sys.argv[2])

doc = Document(str(src))
lines = []

# Iterate body in document order (paragraphs and tables interleaved)
from docx.oxml.ns import qn

for child in doc.element.body.iterchildren():
    if child.tag == qn("w:p"):
        # paragraph
        text = "".join(node.text or "" for node in child.iter(qn("w:t")))
        text = text.strip()
        if text:
            # detect heading style if any
            pStyle = child.find(qn("w:pPr"))
            style_name = ""
            if pStyle is not None:
                pstyle = pStyle.find(qn("w:pStyle"))
                if pstyle is not None:
                    style_name = pstyle.get(qn("w:val")) or ""
            if style_name and "Heading" in style_name:
                lines.append(f"\n## [{style_name}] {text}")
            elif style_name and ("Title" in style_name or "Titre" in style_name):
                lines.append(f"\n# [{style_name}] {text}")
            else:
                lines.append(text)
    elif child.tag == qn("w:tbl"):
        # table
        lines.append("\n----- TABLE -----")
        for row in child.iter(qn("w:tr")):
            cells_text = []
            for cell in row.iter(qn("w:tc")):
                cell_text = " ".join(
                    (node.text or "").strip()
                    for node in cell.iter(qn("w:t"))
                ).strip()
                cells_text.append(cell_text)
            lines.append(" | ".join(cells_text))
        lines.append("----- END TABLE -----\n")

out.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {out} ({len(lines)} lines)")

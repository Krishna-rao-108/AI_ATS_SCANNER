import io
import logging
import os
import re
import shutil
from typing import List, Optional

from docx import Document
from pypdf import PdfReader

from app.utils.text_sanitizer import sanitize_text

logger = logging.getLogger(__name__)

# Optional PDFium rendering import
try:
    import pypdfium2 as pdfium
except ImportError:
    pdfium = None

# Optional OCR imports
try:
    from PIL import Image
    import pytesseract
except ImportError:
    Image = None
    pytesseract = None


class FileParsingError(ValueError):
    """Base exception for file parsing errors."""
    pass


class UnsupportedFileTypeError(FileParsingError):
    """Raised when the file type/extension is unsupported."""
    pass


class CorruptFileError(FileParsingError):
    """Raised when a file is corrupted, malformed, or unreadable."""
    pass


class OCRDependencyError(FileParsingError):
    """Raised when OCR is required but Tesseract or dependencies are missing."""
    pass


class OCRExtractionError(FileParsingError):
    """Raised when OCR execution encounters an unrecoverable processing error."""
    pass


class EmptyExtractedTextError(FileParsingError):
    """Raised when extracted text is completely empty or insufficient."""
    pass


class InvalidResumeTextError(FileParsingError):
    """Raised when extracted text fails content or encoding validation."""
    pass


def configure_tesseract() -> None:
    """Ensures pytesseract can locate the Tesseract executable across platforms."""
    if pytesseract is None:
        return

    if shutil.which("tesseract"):
        return

    # Check standard Homebrew (Apple Silicon / Intel) and Linux binary locations
    common_paths = [
        "/opt/homebrew/bin/tesseract",
        "/usr/local/bin/tesseract",
        "/usr/bin/tesseract",
        "/bin/tesseract",
    ]
    for path in common_paths:
        if os.path.isfile(path) and os.access(path, os.X_OK):
            pytesseract.pytesseract.tesseract_cmd = path
            return


def is_tesseract_available() -> bool:
    """Returns True if Tesseract OCR is installed and functional."""
    if pytesseract is None:
        return False
    configure_tesseract()
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def is_insufficient_text(text: str, min_chars: int = 40, min_words: int = 5) -> bool:
    """
    Determines if text is empty, trivial, or lacks meaningful resume content.
    Returns True if text is insufficient (e.g., only numbers, stray symbols, or whitespace).
    """
    if not text or not text.strip():
        return True

    cleaned = text.strip()
    if len(cleaned) < min_chars:
        return True

    words = re.findall(r"\b[A-Za-z0-9]{2,}\b", cleaned)
    if len(words) < min_words:
        return True

    return False


def validate_extracted_text(text: str, min_chars: int = 40, min_words: int = 5) -> str:
    """
    Validates that extracted text is suitable for resume processing.
    Raises EmptyExtractedTextError or InvalidResumeTextError if validation fails.
    """
    if not text or not text.strip():
        raise EmptyExtractedTextError("No readable text found in the uploaded resume.")

    cleaned = text.strip()

    # Verify text is not dominated by unprintable/binary garbage characters
    printable_count = sum(1 for c in cleaned if c.isprintable() or c in "\n\r\t")
    if len(cleaned) > 0 and (printable_count / len(cleaned)) < 0.75:
        raise InvalidResumeTextError(
            "Extracted text appears corrupted or contains unreadable binary characters."
        )

    words = re.findall(r"\b[A-Za-z0-9]{2,}\b", cleaned)
    if len(words) < min_words or len(cleaned) < min_chars:
        raise EmptyExtractedTextError("No readable text found in the uploaded resume.")

    return cleaned


def _perform_ocr_on_pdf_pages(
    file_path: str,
    target_page_indices: List[int],
    fallback_reader: Optional[PdfReader] = None,
) -> dict[int, str]:
    """
    Renders specified pages of a PDF and runs local Tesseract OCR.
    Prefers pypdfium2 for rasterization, falling back to embedded images via pypdf.
    """
    if pytesseract is None or not is_tesseract_available():
        raise OCRDependencyError(
            "OCR extraction failed: Tesseract OCR is not installed or available on the system. "
            "Please install Tesseract (e.g. 'brew install tesseract' on macOS or "
            "'sudo apt-get install -y tesseract-ocr' on Linux) to process image-based PDFs."
        )

    configure_tesseract()
    assert pytesseract is not None
    ocr_results: dict[int, str] = {}

    # Approach 1: High-fidelity rasterization using pypdfium2
    if pdfium is not None:
        try:
            doc = pdfium.PdfDocument(file_path)
            total_pages = len(doc)
            for page_idx in target_page_indices:
                if 0 <= page_idx < total_pages:
                    try:
                        page = doc[page_idx]
                        # Render at scale 2 (~144 DPI) for fast, highly accurate OCR
                        rendered_image = page.render(scale=2).to_pil()
                        page_text = pytesseract.image_to_string(rendered_image)
                        page_text_str = page_text if isinstance(page_text, str) else str(page_text)
                        ocr_results[page_idx] = page_text_str.strip()
                    except Exception as page_err:
                        logger.warning(
                            f"pdfium OCR failed on page {page_idx}: {page_err}"
                        )
            if ocr_results:
                return ocr_results
        except Exception as doc_err:
            logger.warning(f"Failed to open PDF with pdfium: {doc_err}")

    # Approach 2: Extract embedded images from pypdf
    if fallback_reader is not None and Image is not None:
        try:
            for page_idx in target_page_indices:
                if 0 <= page_idx < len(fallback_reader.pages):
                    page = fallback_reader.pages[page_idx]
                    page_img_texts: List[str] = []
                    try:
                        for img_obj in page.images:
                            img = Image.open(io.BytesIO(img_obj.data))
                            text = pytesseract.image_to_string(img)
                            text_str = text if isinstance(text, str) else str(text) if text else ""
                            if text_str.strip():
                                page_img_texts.append(text_str.strip())
                    except Exception as img_err:
                        logger.warning(
                            f"Image extraction OCR failed on page {page_idx}: {img_err}"
                        )

                    if page_img_texts:
                        ocr_results[page_idx] = "\n".join(page_img_texts).strip()
            if ocr_results:
                return ocr_results
        except Exception as fallback_err:
            logger.warning(f"Fallback embedded image OCR failed: {fallback_err}")

    return ocr_results


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file:
    1. First attempts standard text stream extraction via pypdf.
    2. If extracted text is empty or insufficient, falls back to local Tesseract OCR.
    3. Validates and returns sanitized extracted text.
    """
    if not os.path.exists(file_path):
        raise CorruptFileError("The specified file does not exist.")

    if os.path.getsize(file_path) == 0:
        raise CorruptFileError("The uploaded PDF file is empty (0 bytes).")

    reader = None
    extracted_pages: List[str] = []
    insufficient_pages: List[int] = []
    pdf_read_error: Optional[Exception] = None

    # Step 1: Attempt standard PDF text extraction
    try:
        reader = PdfReader(file_path)
        if len(reader.pages) == 0:
            raise CorruptFileError("PDF file contains no pages.")

        for idx, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
            except Exception:
                page_text = ""

            extracted_pages.append(page_text)
            if is_insufficient_text(page_text, min_chars=30, min_words=4):
                insufficient_pages.append(idx)

    except Exception as e:
        pdf_read_error = e
        logger.warning(f"Standard PDF reading failed: {e}")

    # Check if standard extraction was completely sufficient across all pages
    if (
        reader is not None
        and len(insufficient_pages) == 0
        and not is_insufficient_text("\n".join(extracted_pages))
    ):
        raw_text = "\n\n".join(extracted_pages).strip()
        sanitized = sanitize_text(raw_text)
        return validate_extracted_text(sanitized)

    # Step 2: Use OCR as fallback for scanned or image-based pages
    pages_to_ocr: List[int] = []
    if reader is not None:
        # If whole document text is insufficient, OCR all pages; otherwise OCR insufficient pages
        total_std_text = "\n".join(extracted_pages)
        if is_insufficient_text(total_std_text):
            pages_to_ocr = list(range(len(reader.pages)))
        else:
            pages_to_ocr = insufficient_pages
    else:
        # If PdfReader failed completely, attempt to determine page count via pdfium
        if pdfium is not None:
            try:
                doc = pdfium.PdfDocument(file_path)
                pages_to_ocr = list(range(len(doc)))
            except Exception:
                pages_to_ocr = [0]
        else:
            pages_to_ocr = [0]

    ocr_results: dict[int, str] = {}
    ocr_exception: Optional[Exception] = None

    try:
        ocr_results = _perform_ocr_on_pdf_pages(
            file_path=file_path,
            target_page_indices=pages_to_ocr,
            fallback_reader=reader,
        )
    except OCRDependencyError:
        raise
    except Exception as e:
        ocr_exception = e
        logger.warning(f"OCR fallback encountered error: {e}")

    # Step 3: Merge standard and OCR extractions
    final_pages: List[str] = []
    total_page_count = len(reader.pages) if reader else max(len(ocr_results), 1)

    for idx in range(total_page_count):
        std_p = extracted_pages[idx] if idx < len(extracted_pages) else ""
        ocr_p = ocr_results.get(idx, "")

        # Prefer OCR text if standard text was insufficient on this page
        if not is_insufficient_text(ocr_p) and is_insufficient_text(std_p):
            final_pages.append(ocr_p)
        elif not is_insufficient_text(std_p):
            final_pages.append(std_p)
        elif ocr_p:
            final_pages.append(ocr_p)
        elif std_p:
            final_pages.append(std_p)

    combined_text = "\n\n".join(p for p in final_pages if p.strip()).strip()

    if combined_text:
        sanitized = sanitize_text(combined_text)
        try:
            return validate_extracted_text(sanitized)
        except EmptyExtractedTextError:
            pass

    # If we reached here, neither standard nor OCR produced readable text
    if pdf_read_error and not ocr_results:
        raise CorruptFileError(
            f"Failed to read PDF file. The file appears to be corrupted or invalid: {pdf_read_error}"
        )

    if ocr_exception:
        raise OCRExtractionError(
            f"OCR text extraction failed: {ocr_exception}. "
            "Please ensure the document contains clear, readable content."
        )

    raise EmptyExtractedTextError("No readable text found in the uploaded resume.")


def extract_text_from_docx(file_path: str) -> str:
    """
    Extracts text content from a DOCX file, including body paragraphs and tables.
    Preserves the existing DOCX parsing path while handling corrupt files safely.
    """
    if not os.path.exists(file_path):
        raise CorruptFileError("The specified file does not exist.")

    if os.path.getsize(file_path) == 0:
        raise CorruptFileError("The uploaded DOCX file is empty (0 bytes).")

    try:
        document = Document(file_path)
    except Exception as e:
        raise CorruptFileError(
            f"Failed to read DOCX file. The file appears to be corrupted or invalid: {e}"
        ) from e

    # Extract regular paragraphs
    extracted_paragraphs = [
        p.text.strip() for p in document.paragraphs if p.text and p.text.strip()
    ]

    # Also extract text from tables (common for formatted resume headers/skills)
    table_paragraphs: List[str] = []
    seen_table_texts = set(extracted_paragraphs)
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    cell_text = p.text.strip() if p.text else ""
                    if cell_text and cell_text not in seen_table_texts:
                        table_paragraphs.append(cell_text)
                        seen_table_texts.add(cell_text)

    all_content = extracted_paragraphs + table_paragraphs
    raw_text = "\n".join(all_content).strip()

    sanitized = sanitize_text(raw_text)
    return validate_extracted_text(sanitized)


def extract_text(file_path: str) -> str:
    """
    Extract text content from a PDF or DOCX file with automatic OCR fallback.
    Raises FileParsingError (or subclass) if parsing or validation fails.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    else:
        raise UnsupportedFileTypeError(
            f"Unsupported file type '{ext}'. Only PDF and DOCX files are allowed."
        )
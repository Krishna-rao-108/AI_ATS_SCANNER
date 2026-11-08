import re
import unicodedata
from typing import Dict

# Map of standard Unicode ligatures to plain character sequences
UNICODE_LIGATURE_MAP: Dict[str, str] = {
    "\ufb00": "ff",
    "\ufb01": "fi",
    "\ufb02": "fl",
    "\ufb03": "ffi",
    "\ufb04": "ffl",
    "\ufb05": "ft",
    "\ufb06": "st",
    "ﬁ": "fi",
    "ﬂ": "fl",
    "ﬀ": "ff",
    "ﬃ": "ffi",
    "ﬄ": "ffl",
    "ﬆ": "st",
}

# Regex patterns for repairing font CMap extraction artifacts in PDFs where
# ligatures were erroneously decoded to single uppercase letters (R, X, F, Z, K, etc.)
# e.g. GeneraRon -> Generation, SoZware -> Software, PydanRc -> Pydantic, InformaXon -> Information
LIGATURE_REPAIR_PATTERNS = [
    # "ti" ligature mapped to "R" e.g. GeneraRon -> Generation
    (re.compile(r"\b([A-Za-z]+)aRon\b"), r"\1ation"),
    (re.compile(r"\b([A-Za-z]+)aRons\b"), r"\1ations"),
    (re.compile(r"\b([A-Za-z]+)cRon\b"), r"\1ction"),
    (re.compile(r"\b([A-Za-z]+)cRons\b"), r"\1ctions"),
    (re.compile(r"\b([A-Za-z]+)quesRons\b", re.IGNORECASE), r"\1questions"),
    (re.compile(r"\b([A-Za-z]+)citaRons\b", re.IGNORECASE), r"\1citations"),
    (re.compile(r"\b([A-Za-z]+)secRon\b", re.IGNORECASE), r"\1section"),
    (re.compile(r"\b([A-Za-z]+)secRons\b", re.IGNORECASE), r"\1sections"),
    (re.compile(r"\b([A-Za-z]+)opRmizaRon\b", re.IGNORECASE), r"\1optimization"),
    (re.compile(r"\b([A-Za-z]+)integraRon\b", re.IGNORECASE), r"\1integration"),
    (re.compile(r"\b([A-Za-z]+)validaRon\b", re.IGNORECASE), r"\1validation"),
    (re.compile(r"\b([A-Za-z]+)extracRon\b", re.IGNORECASE), r"\1extraction"),
    (re.compile(r"\b([A-Za-z]+)producRon\b", re.IGNORECASE), r"\1production"),
    (re.compile(r"\b([A-Za-z]+)hallucinaRon\b", re.IGNORECASE), r"\1hallucination"),
    (re.compile(r"\b([A-Za-z]+)descripRons\b", re.IGNORECASE), r"\1descriptions"),
    (re.compile(r"\bcerR[ﬁfi]*caRons?\b", re.IGNORECASE), "certifications"),
    (re.compile(r"\bCerR[ﬁfi]*caRons?\b"), "Certifications"),
    (re.compile(r"\bcerRfications?\b", re.IGNORECASE), "certifications"),
    (re.compile(r"\bCerRfications?\b"), "Certifications"),
    (re.compile(r"\b([A-Za-z]+)compaRbility\b", re.IGNORECASE), r"\1compatibility"),
    (re.compile(r"\b([A-Za-z]+)mulRple\b", re.IGNORECASE), r"\1multiple"),
    (re.compile(r"\b([A-Za-z]+)automaRcally\b", re.IGNORECASE), r"\1automatically"),
    (re.compile(r"\b([A-Za-z]+)determinisRc\b", re.IGNORECASE), r"\1deterministic"),
    (re.compile(r"\b([A-Za-z]+)naRve\b", re.IGNORECASE), r"\1native"),
    (re.compile(r"\b([A-Za-z]+)acquisiRon\b", re.IGNORECASE), r"\1acquisition"),
    (re.compile(r"\b([A-Za-z]+)idenRfy\b", re.IGNORECASE), r"\1identify"),
    (re.compile(r"\b([A-Za-z]+)tesRng\b", re.IGNORECASE), r"\1testing"),
    (re.compile(r"\b([A-Za-z]+)contribuRng\b", re.IGNORECASE), r"\1contributing"),
    (re.compile(r"\b([A-Za-z]+)connecRng\b", re.IGNORECASE), r"\1connecting"),
    
    # Specific known corrupted tech terms:
    (re.compile(r"\bPydan[R|F]c\b", re.IGNORECASE), "Pydantic"),
    (re.compile(r"\bPydanFc\b", re.IGNORECASE), "Pydantic"),
    (re.compile(r"\bSoZware\b"), "Software"),
    (re.compile(r"\bsoZware\b"), "software"),
    (re.compile(r"\bSwi[Z|K]UI\b"), "SwiftUI"),
    (re.compile(r"\bInformaXon\b"), "Information"),
    (re.compile(r"\binformaXon\b"), "information"),
]

# Explicit known word repair table for high-confidence replacement
KNOWN_CORRUPTED_WORDS: Dict[str, str] = {
    "GeneraRon": "Generation",
    "generaRon": "generation",
    "ExtracRon": "Extraction",
    "extracRon": "extraction",
    "IntegraRon": "Integration",
    "integraRon": "integration",
    "PydanRc": "Pydantic",
    "PydanFc": "Pydantic",
    "pydanRc": "pydantic",
    "pydanFc": "pydantic",
    "SoZware": "Software",
    "soZware": "software",
    "ProducRon": "Production",
    "producRon": "production",
    "InformaXon": "Information",
    "informaXon": "information",
    "SwiKUI": "SwiftUI",
    "SwiZUI": "SwiftUI",
    "swiKUI": "swiftUI",
    "swiZUI": "swiftUI",
    "acquisiRon": "acquisition",
    "automaRcally": "automatically",
    "cerRﬁcaRons": "certifications",
    "cerRficaRons": "certifications",
    "cerRﬁcaRon": "certification",
    "cerRficaRon": "certification",
    "citaRons": "citations",
    "compaRbility": "compatibility",
    "connecRng": "connecting",
    "contribuRng": "contributing",
    "descripRons": "descriptions",
    "determinisRc": "deterministic",
    "educaRon": "education",
    "hallucinaRon": "hallucination",
    "idenRfy": "identify",
    "mulRple": "multiple",
    "naRve": "native",
    "opRmizaRon": "optimization",
    "quesRons": "questions",
    "secRon": "section",
    "secRons": "sections",
    "tesRng": "testing",
    "validaRon": "validation",
}


def sanitize_text(text: str) -> str:
    """
    Cleans and repairs Unicode text extracted from PDF or DOCX documents:
    1. Replaces Unicode ligature characters (fi, fl, ff, etc.) with plain ASCII pairs.
    2. Repairs broken font CMap encoding corruptions (e.g. GeneraRon -> Generation).
    3. Normalizes smart quotes, apostrophes, dashes, and whitespace.
    Preserves all factual content without altering authentic technical terms (e.g. PyMuPDF, JavaScript).
    """
    if not text:
        return ""

    result = text

    # 1. Replace standard unicode ligatures
    for lig, replacement in UNICODE_LIGATURE_MAP.items():
        if lig in result:
            result = result.replace(lig, replacement)

    # 2. Normalize smart quotes and special dashes while preserving semantic content
    result = result.replace("\u2018", "'").replace("\u2019", "'")
    result = result.replace("\u201c", '"').replace("\u201d", '"')
    result = result.replace("\u00a0", " ")  # non-breaking space
    result = result.replace("\u200b", "")   # zero-width space

    # 3. Apply exact known corrupted word replacements
    for bad_word, good_word in KNOWN_CORRUPTED_WORDS.items():
        if bad_word in result:
            # Word boundary regex to avoid partial substring accidental matches
            result = re.sub(rf"\b{re.escape(bad_word)}\b", good_word, result)

    # 4. Apply pattern-based ligature repairs
    for pattern, replacement in LIGATURE_REPAIR_PATTERNS:
        result = pattern.sub(replacement, result)

    # 5. Fix awkward hyphenation where line-breaks left space after hyphen: e.g. "Retrieval- Augmented" -> "Retrieval-Augmented"
    result = re.sub(r"(?<=[A-Za-z0-9])-[ \t]+(?=[A-Za-z0-9])", "-", result)

    # 6. Fix spaces before punctuation: e.g. "PyMuPDF ," -> "PyMuPDF,", "(v2) ." -> "(v2)."
    result = re.sub(r"[ \t]+([,;])", r"\1", result)
    result = re.sub(r"[ \t]+([.!?])", r"\1", result)

    return result

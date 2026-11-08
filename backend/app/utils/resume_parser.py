import re
from typing import Dict, List, Optional, Tuple
from app.schemas.tailor import (
    BulletComparison,
    CertificationItem,
    ContactInfo,
    EducationItem,
    ProjectItem,
    SkillsCategory,
    WorkExperienceItem,
    AdditionalSectionItem,
)
from app.utils.text_sanitizer import sanitize_text


EMAIL_REGEX = re.compile(r"[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}")
PHONE_REGEX = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b")
LINKEDIN_REGEX = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_\-]+)", re.IGNORECASE)
GITHUB_REGEX = re.compile(r"(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_\-]+)", re.IGNORECASE)
PORTFOLIO_REGEX = re.compile(r"(?:https?://)?(?:www\.)?([a-zA-Z0-9_\-]+\.(?:dev|me|io|com|app|org|tech|site|portfolio))(?:/[^\s]*)?", re.IGNORECASE)

DATE_RANGE_REGEX = re.compile(
    r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current|Ongoing)\b",
    re.IGNORECASE,
)


EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "icloud.com", "live.com", "proton.me", "protonmail.com", "mail.com"
}


def extract_contact_info(text: str) -> ContactInfo:
    text = sanitize_text(text)
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return ContactInfo()

    name = lines[0]
    if "|" in name:
        name = name.split("|")[0].strip()

    email_match = EMAIL_REGEX.search(text)
    email = email_match.group(0) if email_match else None

    phone_match = PHONE_REGEX.search(text)
    phone = phone_match.group(0) if phone_match else None

    linkedin_match = LINKEDIN_REGEX.search(text)
    linkedin = linkedin_match.group(0) if linkedin_match else None

    github_match = GITHUB_REGEX.search(text)
    github = github_match.group(0) if github_match else None

    website = None
    for m in PORTFOLIO_REGEX.finditer(text):
        matched_str = m.group(0).strip()
        lower_match = matched_str.lower()
        if "linkedin.com" in lower_match or "github.com" in lower_match:
            continue
        if any(dom in lower_match for dom in EMAIL_DOMAINS):
            continue
        website = matched_str
        break

    location = None
    for line in lines[:8]:
        loc_match = re.search(r"([A-Za-z\s]+,\s*(?:[A-Za-z\s]+|[A-Z]{2}))", line)
        if loc_match:
            candidate = loc_match.group(1).strip()
            if not any(skip in candidate.lower() for skip in ["college", "university", "school", "developer", "engineer", "summary", "technologies"]):
                location = candidate
                break

    title = None
    if len(lines) > 1 and not EMAIL_REGEX.search(lines[1]) and not PHONE_REGEX.search(lines[1]):
        if len(lines[1]) < 80 and not any(k in lines[1].lower() for k in ["http", "github", "linkedin"]):
            title = lines[1].replace("—", "-").strip()

    return ContactInfo(
        name=name,
        title=title,
        email=email,
        phone=phone,
        location=location,
        linkedin=linkedin,
        github=github,
        website=website,
        portfolio=website,
    )


SECTION_HEADINGS: List[Tuple[str, re.Pattern]] = [
    ("summary", re.compile(r"^(?:professional\s+summary|summary|profile|about\s+me|career\s+objective|objective)$", re.IGNORECASE)),
    ("skills", re.compile(r"^(?:technical\s+skills|skills|core\s+competencies|technologies|skills\s+and\s+tools|areas\s+of\s+expertise)$", re.IGNORECASE)),
    ("experience", re.compile(r"^(?:work\s+experience|professional\s+experience|experience|employment\s+history|internship\s+experience|work\s+history)$", re.IGNORECASE)),
    ("projects", re.compile(r"^(?:projects|academic\s+projects|personal\s+projects|key\s+projects|technical\s+projects|notable\s+projects)$", re.IGNORECASE)),
    ("education", re.compile(r"^(?:education|e\s*d\s*u\s*c\s*a\s*t\s*i\s*o\s*n|academic\s+background|qualifications)$", re.IGNORECASE)),
    ("certifications", re.compile(r"^(?:certifications|certificates|licenses|accreditations)$", re.IGNORECASE)),
    ("achievements", re.compile(r"^(?:achievements|awards|honors|accomplishments|awards\s+&\s+achievements)$", re.IGNORECASE)),
    ("publications", re.compile(r"^(?:publications|research|research\s+papers)$", re.IGNORECASE)),
    ("volunteering", re.compile(r"^(?:volunteering|volunteer\s+experience|extracurricular|extracurricular\s+activities|leadership|activities|leadership\s+&\s+volunteering)$", re.IGNORECASE)),
    ("languages", re.compile(r"^(?:languages|language\s+proficiency)$", re.IGNORECASE)),
    ("coursework", re.compile(r"^(?:relevant\s+coursework|coursework)$", re.IGNORECASE)),
]


def partition_resume_sections(text: str) -> Dict[str, str]:
    """
    Partitions resume text into recognized standard and custom sections.
    Guarantees no section text is discarded and candidate header is never placed in 'other'.
    """
    clean_text = sanitize_text(text)
    lines = clean_text.split("\n")
    sections: Dict[str, List[str]] = {
        "header": [],
        "summary": [],
        "skills": [],
        "experience": [],
        "projects": [],
        "education": [],
        "certifications": [],
        "achievements": [],
        "publications": [],
        "volunteering": [],
        "languages": [],
        "coursework": [],
        "other": [],
    }

    current_section = "header"

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        # Skip lines that are bullets or contain inline key-value colons
        if line.startswith(("•", "-", "*", "–", "—", ">", "·", "▪", "■")):
            if current_section not in sections:
                sections[current_section] = []
            sections[current_section].append(line)
            continue

        matched_section = None
        clean_header_candidate = re.sub(r"[\s_•\-\*\:]+", " ", line).strip()

        # A section header must be standalone (length <= 50) and not an inline key-value pair
        if len(line) <= 50 and (":" not in line or line.endswith(":")):
            for sec_name, sec_regex in SECTION_HEADINGS:
                if sec_regex.match(clean_header_candidate):
                    matched_section = sec_name
                    break

            # Check for arbitrary uppercase header e.g. "LEADERSHIP & AFFILIATIONS"
            # CRITICAL: Only allow this AFTER leaving header, to avoid treating the candidate's name as an "other" section!
            if not matched_section and current_section != "header" and line.isupper() and len(line) < 40 and not any(c in line for c in ["@", "HTTP", "WWW", "/"]):
                if not any(k in line.lower() for k in ["mumbai", "india", "engineer", "developer", "phone", "email"]):
                    matched_section = "other"
                    sections["other"].append(f"### {line}")
                    current_section = "other"
                    continue

        if matched_section:
            current_section = matched_section
            continue

        if current_section not in sections:
            sections[current_section] = []
        sections[current_section].append(line)

    return {k: "\n".join(v).strip() for k, v in sections.items()}


BULLET_MARKER_REGEX = re.compile(r"^[•\-\*\–\—\>\·\▪\■]\s*(.*)")


def extract_raw_bullets(text: str) -> List[str]:
    """Extracts bullet points from text using common bullet markers or leading dashes."""
    bullets: List[str] = []
    current_bullet: List[str] = []

    for line in text.split("\n"):
        line_str = line.strip()
        if not line_str:
            continue

        match = BULLET_MARKER_REGEX.match(line_str)
        if match:
            if current_bullet:
                bullets.append(" ".join(current_bullet).strip())
                current_bullet = []
            content = match.group(1).strip()
            if content:
                current_bullet.append(content)
        elif current_bullet:
            current_bullet.append(line_str)
        elif len(line_str) > 20 and not line_str.endswith(":") and not line_str.startswith("#"):
            bullets.append(line_str)

    if current_bullet:
        bullets.append(" ".join(current_bullet).strip())

    return bullets


def extract_structured_projects(proj_sec: str) -> List[ProjectItem]:
    """
    Extracts individual projects with title, technologies, dates, description, and bullets.
    Keeps wrapped lines inside the same bullet and never drops continuation lines.
    """
    if not proj_sec or not proj_sec.strip():
        return []

    clean_proj = sanitize_text(proj_sec)
    projects: List[ProjectItem] = []
    lines = [l.strip() for l in clean_proj.split("\n") if l.strip()]

    current_title = ""
    current_tech = ""
    current_dates = ""
    current_description = ""
    current_bullets: List[str] = []

    def flush_current():
        nonlocal current_title, current_tech, current_dates, current_description, current_bullets
        if current_title or current_bullets or current_description:
            title_to_use = current_title or "Technical Project"
            bullet_comps = [
                BulletComparison(
                    original=b,
                    tailored=b,
                    explanation="Preserved original source project bullet point.",
                    source_evidence=b,
                    grounding_status="verified",
                )
                for b in current_bullets
            ]
            projects.append(
                ProjectItem(
                    title=title_to_use,
                    technologies=current_tech or None,
                    dates=current_dates or None,
                    description=current_description or None,
                    bullets=bullet_comps,
                )
            )
            current_title = ""
            current_tech = ""
            current_dates = ""
            current_description = ""
            current_bullets = []

    for line in lines:
        bullet_match = BULLET_MARKER_REGEX.match(line)
        if bullet_match:
            b_text = bullet_match.group(1).strip()
            if b_text:
                current_bullets.append(b_text)
            continue

        # Look for date in header line
        date_match = DATE_RANGE_REGEX.search(line)
        line_dates = date_match.group(0) if date_match else ""

        # Check if line looks like a project header (contains | or has tech keywords or short bold/title)
        if ("|" in line or line_dates) and (len(line) < 150 or not current_title):
            if current_title:
                flush_current()

            parts = [p.strip() for p in line.split("|")]
            current_title = parts[0]
            if len(parts) > 1:
                rem = " | ".join(parts[1:])
                if line_dates and line_dates in rem:
                    current_dates = line_dates
                    current_tech = rem.replace(line_dates, "").strip(" |,-")
                else:
                    current_tech = rem
            elif line_dates:
                current_dates = line_dates
                current_title = current_title.replace(line_dates, "").strip(" -–—,")
            continue

        # If we have bullets, any subsequent line without bullet marker is a wrapped line continuation!
        if current_title and current_bullets:
            current_bullets[-1] = (current_bullets[-1] + " " + line).strip()
        elif current_title and not current_bullets and not current_description:
            current_description = line
        elif current_title and not current_bullets and current_description:
            current_description = (current_description + " " + line).strip()
        else:
            if not current_title:
                current_title = line
            else:
                current_bullets.append(line)

    flush_current()
    return projects


def extract_structured_experience(exp_sec: str) -> List[WorkExperienceItem]:
    """
    Extracts individual work experience items with company, role, dates, location, and bullets.
    Handles multi-line experience headers accurately without creating phantom or fabricated entries.
    """
    if not exp_sec or not exp_sec.strip():
        return []

    clean_exp = sanitize_text(exp_sec)
    items: List[WorkExperienceItem] = []
    lines = [l.strip() for l in clean_exp.split("\n") if l.strip()]

    current_role = ""
    current_company = ""
    current_dates = ""
    current_location = ""
    current_bullets: List[str] = []

    def flush_exp():
        nonlocal current_role, current_company, current_dates, current_location, current_bullets
        if current_role or current_company or current_bullets:
            bullet_comps = [
                BulletComparison(
                    original=b,
                    tailored=b,
                    explanation="Preserved original source experience bullet point.",
                    source_evidence=b,
                    grounding_status="verified",
                )
                for b in current_bullets
            ]
            items.append(
                WorkExperienceItem(
                    company=current_company or "Work Experience",
                    role=current_role or current_company or "Role",
                    dates=current_dates or None,
                    location=current_location or None,
                    bullets=bullet_comps,
                )
            )
            current_role = ""
            current_company = ""
            current_dates = ""
            current_location = ""
            current_bullets = []

    for line in lines:
        bullet_match = BULLET_MARKER_REGEX.match(line)
        if bullet_match:
            b_text = bullet_match.group(1).strip()
            if b_text:
                current_bullets.append(b_text)
            continue

        date_match = DATE_RANGE_REGEX.search(line)
        line_dates = date_match.group(0) if date_match else ""

        # Multi-line subtitle handling (e.g. "Self-employed / Early team member • Aug 2026 – Present")
        # before any bullets are hit: attach dates & subtitle to active role/company!
        if (current_role or current_company) and not current_bullets:
            if line_dates:
                current_dates = line_dates
                sub_text = line.replace(line_dates, "").strip(" |•·–—,-()")
                if sub_text and not current_location and any(loc in sub_text.lower() for loc in ["india", "usa", "remote", "mumbai", "san francisco", "york"]):
                    current_location = sub_text
                continue
            elif not "|" in line and not "—" in line and len(line) < 60:
                # Subtitle text
                continue

        # Experience header line e.g. "Founding Growth, SEO & QA — prune. (AI Startup)"
        if ("|" in line or "—" in line or " - " in line or line_dates) and len(line) < 100:
            if current_role or current_company:
                flush_exp()

            current_dates = line_dates
            clean_line = line.replace(line_dates, "").strip(" |,-–—()") if line_dates else line
            delims = ["|", "—", " - "]
            split_done = False
            for d in delims:
                if d in clean_line:
                    parts = clean_line.split(d, 1)
                    current_role = parts[0].strip()
                    current_company = parts[1].strip()
                    split_done = True
                    break

            if not split_done:
                current_company = clean_line
                current_role = clean_line
            continue

        if current_bullets:
            # Wrapped continuation line of the previous bullet!
            current_bullets[-1] = (current_bullets[-1] + " " + line).strip()
        elif current_role or current_company:
            current_bullets.append(line)
        else:
            current_company = line

    flush_exp()
    return items


def extract_structured_skills(skills_sec: str) -> List[SkillsCategory]:
    """Extracts organized skill categories from skills section."""
    if not skills_sec or not skills_sec.strip():
        return []

    clean_skills = sanitize_text(skills_sec)
    categories: List[SkillsCategory] = []
    lines = [l.strip() for l in clean_skills.split("\n") if l.strip()]

    for line in lines:
        if ":" in line:
            cat_name, raw_skills = line.split(":", 1)
            skills_list = [s.strip() for s in re.split(r"[,•|/]", raw_skills) if s.strip()]
            if skills_list:
                clean_name = cat_name.strip()
                existing = next((c for c in categories if c.category.lower() == clean_name.lower()), None)
                if existing:
                    for s in skills_list:
                        if s not in existing.skills:
                            existing.skills.append(s)
                else:
                    categories.append(SkillsCategory(category=clean_name, skills=skills_list))
        else:
            skills_list = [s.strip() for s in re.split(r"[,•|/]", line) if s.strip()]
            if skills_list:
                if categories:
                    # Merge continuation lines into preceding category without losing any skill
                    for s in skills_list:
                        if s not in categories[-1].skills:
                            categories[-1].skills.append(s)
                else:
                    categories.append(SkillsCategory(category="Technical Skills", skills=skills_list))

    return categories


DEGREE_INDICATORS = ["b.sc", "bsc", "b.tech", "btech", "b.e.", "be", "bachelor", "m.sc", "msc", "m.tech", "master", "phd", "associate", "diploma", "degree", "high school"]
INSTITUTION_INDICATORS = ["college", "university", "institute", "school", "academy", "campus"]


def extract_structured_education(edu_sec: str) -> List[EducationItem]:
    """
    Extracts degree, institution, dates, and details from education section.
    Accurately identifies degree vs. institution and ensures consistent ordering.
    """
    if not edu_sec or not edu_sec.strip():
        return []

    clean_edu = sanitize_text(edu_sec)
    items: List[EducationItem] = []
    lines = [l.strip() for l in clean_edu.split("\n") if l.strip()]

    if not lines:
        return []

    # Check for multi-line block vs single-line pipe format
    # Case 1: First line is "Degree — College" or "College — Degree", second line is "Dates | CGPA"
    if len(lines) >= 2:
        line0 = lines[0]
        line1 = lines[1]

        # Extract dates and GPA from line 1 if present
        date_m = DATE_RANGE_REGEX.search(line1)
        edu_dates = date_m.group(0) if date_m else None
        
        # Check for CGPA / GPA / percentage in line 1
        gpa_m = re.search(r"(?:CGPA|GPA|Grade|Percentage)?:?\s*(\d+(?:\.\d+)?(?:\s*/\s*\d+)?)", line1, re.IGNORECASE)
        gpa_detail = line1
        if edu_dates:
            gpa_detail = gpa_detail.replace(edu_dates, "").strip(" |,-–—()")

        # Now parse line 0 for degree and institution
        delims = ["—", " - ", "|"]
        deg = line0
        inst = "University"
        for d in delims:
            if d in line0:
                p0, p1 = [p.strip() for p in line0.split(d, 1)]
                p0_lower = p0.lower()
                p1_lower = p1.lower()
                # Check which side has degree vs institution keywords
                if any(k in p0_lower for k in DEGREE_INDICATORS) or any(k in p1_lower for k in INSTITUTION_INDICATORS):
                    deg = p0
                    inst = p1
                elif any(k in p1_lower for k in DEGREE_INDICATORS) or any(k in p0_lower for k in INSTITUTION_INDICATORS):
                    deg = p1
                    inst = p0
                else:
                    deg = p0
                    inst = p1
                break

        items.append(
            EducationItem(
                degree=deg,
                institution=inst,
                dates=edu_dates,
                gpa_or_details=gpa_detail or None,
            )
        )
        return items

    # Single line parsing
    line = lines[0]
    date_m = DATE_RANGE_REGEX.search(line)
    edu_dates = date_m.group(0) if date_m else None
    if edu_dates:
        line = line.replace(edu_dates, "").strip(" |,-–—()")

    gpa_m = re.search(r"(?:CGPA|GPA)?:?\s*(\d+(?:\.\d+)?(?:\s*/\s*\d+)?)", line, re.IGNORECASE)
    gpa_detail = None
    if gpa_m and ("cgpa" in line.lower() or "gpa" in line.lower()):
        gpa_detail = gpa_m.group(0).strip()
        line = line.replace(gpa_detail, "").strip(" |,-–—()")

    delims = ["—", " - ", "|"]
    deg = line
    inst = "University"
    for d in delims:
        if d in line:
            parts = [p.strip() for p in line.split(d)]
            deg = parts[0]
            inst = parts[1] if len(parts) > 1 else "University"
            break

    items.append(EducationItem(degree=deg, institution=inst, dates=edu_dates, gpa_or_details=gpa_detail))
    return items


def extract_structured_certifications(cert_sec: str) -> List[CertificationItem]:
    """Extracts certifications from certifications section."""
    if not cert_sec or not cert_sec.strip():
        return []

    clean_cert = sanitize_text(cert_sec)
    certs: List[CertificationItem] = []
    for line in clean_cert.split("\n"):
        clean = line.strip().lstrip("•-* ")
        if not clean:
            continue
        issuer = None
        date = None
        if "—" in clean:
            parts = clean.split("—", 1)
            name = parts[0].strip()
            issuer = parts[1].strip()
        elif " - " in clean:
            parts = clean.split(" - ", 1)
            name = parts[0].strip()
            issuer = parts[1].strip()
        else:
            name = clean

        date_m = re.search(r"\(([^)]+)\)", name)
        if date_m:
            date = date_m.group(1).strip()
            name = name.replace(date_m.group(0), "").strip()

        certs.append(CertificationItem(name=name, issuer=issuer, date=date))

    return certs


def extract_additional_sections(sections: Dict[str, str]) -> List[AdditionalSectionItem]:
    """
    Extracts non-standard sections (achievements, volunteering, publications, etc.)
    into structured AdditionalSectionItems.
    Excludes candidate header, contact information, and headline from additional sections.
    """
    additional: List[AdditionalSectionItem] = []
    standard_keys = {"header", "summary", "skills", "experience", "projects", "education", "certifications"}

    headings_map = {
        "achievements": "Achievements & Awards",
        "publications": "Publications & Research",
        "volunteering": "Leadership & Volunteering",
        "languages": "Languages",
        "coursework": "Relevant Coursework",
        "other": "Additional Information",
    }

    for key, text in sections.items():
        if key not in standard_keys and text and text.strip():
            heading = headings_map.get(key, key.replace("_", " ").title())
            items: List[str] = []
            for line in text.split("\n"):
                l_str = line.strip().lstrip("•-* ")
                if not l_str or l_str.startswith("###"):
                    continue
                # Exclude any contact information, phone, email, URLs, or headline from additional sections
                if any(k in l_str.lower() for k in ["@", "linkedin.com", "github.com", "http:", "https:"]):
                    continue
                if PHONE_REGEX.search(l_str):
                    continue
                if any(title_word in l_str.lower() for title_word in ["backend developer", "software engineer", "full-stack", "frontend developer", "developer -", "developer —"]):
                    continue
                items.append(l_str)
            if items:
                additional.append(AdditionalSectionItem(heading=heading, items=items))

    return additional

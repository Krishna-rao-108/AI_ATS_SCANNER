import io
import re
from xml.sax.saxutils import escape as _raw_xml_escape

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    Flowable,
)

from app.schemas.tailor import TailoredResumeData
from app.utils.text_sanitizer import sanitize_text


def xml_escape(val: str) -> str:
    """Sanitizes Unicode ligatures and escapes dynamic text safely for ReportLab."""
    if not val:
        return ""
    clean = sanitize_text(val)
    return _raw_xml_escape(clean)


def get_safe_filename(candidate_name: str, ext: str = "pdf") -> str:
    """Generate a clean, safe filename from the candidate's name."""
    clean_name = re.sub(r"[^\w\s-]", "", candidate_name).strip()
    clean_name = re.sub(r"[\s-]+", "_", clean_name) or "Candidate"
    clean_ext = ext.lstrip(".").lower()

    return f"{clean_name}_Tailored_Resume.{clean_ext}"


def generate_tailored_pdf(data: TailoredResumeData) -> bytes:
    """
    Generate an ATS-compliant, single-column PDF resume with selectable text.
    Handles multi-page overflow cleanly, preserves project descriptions,
    education, certifications, and additional sections without content truncation.
    """
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=28,
        rightMargin=28,
        topMargin=26,
        bottomMargin=26,
    )

    styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "ATSName",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=19,
        alignment=1,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=1.5,
    )

    contact_style = ParagraphStyle(
        "ATSContact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#334155"),
        spaceAfter=4,
    )

    section_heading_style = ParagraphStyle(
        "ATSSectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=4,
        spaceAfter=1.5,
        keepWithNext=True,
    )

    item_title_style = ParagraphStyle(
        "ATSItemTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=2.5,
        spaceAfter=1,
        keepWithNext=True,
    )

    item_desc_style = ParagraphStyle(
        "ATSItemDesc",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#475569"),
        spaceAfter=1,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "ATSBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#334155"),
        spaceAfter=1.5,
    )

    bullet_style = ParagraphStyle(
        "ATSBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#334155"),
        leftIndent=10,
        firstLineIndent=-7,
        spaceAfter=1,
    )

    story: list[Flowable] = []

    # 1. Header
    candidate_name = data.contact.name.upper() if data.contact.name else "CANDIDATE"
    story.append(Paragraph(f"<b>{xml_escape(candidate_name)}</b>", name_style))

    contact_parts = [
        part
        for part in [
            data.contact.location,
            data.contact.phone,
            data.contact.email,
            data.contact.linkedin,
            data.contact.github,
            data.contact.website or data.contact.portfolio,
        ]
        if part
    ]

    if contact_parts:
        contact_line = " &nbsp;|&nbsp; ".join(xml_escape(part) for part in contact_parts)
        story.append(Paragraph(contact_line, contact_style))

    story.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=colors.HexColor("#cbd5e1"),
            spaceAfter=2.5,
            spaceBefore=1,
        )
    )

    def add_section_header(title: str):
        story.append(Paragraph(f"<b>{xml_escape(title.upper())}</b>", section_heading_style))
        story.append(
            HRFlowable(
                width="100%",
                thickness=0.5,
                color=colors.HexColor("#cbd5e1"),
                spaceAfter=2,
                spaceBefore=1,
            )
        )

    # 2. Professional Summary
    if data.professional_summary:
        add_section_header("Professional Summary")
        story.append(Paragraph(xml_escape(data.professional_summary), body_style))
        story.append(Spacer(1, 1.5))

    # 3. Technical Skills
    if data.skills_categories:
        add_section_header("Technical Skills")
        for cat in data.skills_categories:
            if cat.skills:
                skills_str = ", ".join(cat.skills)
                story.append(
                    Paragraph(
                        f"<b>{xml_escape(cat.category)}:</b> {xml_escape(skills_str)}",
                        body_style,
                    )
                )
        story.append(Spacer(1, 1.5))

    # 4. Work Experience
    if data.experience:
        add_section_header("Work Experience")
        for exp in data.experience:
            header_str = f"<b>{xml_escape(exp.role)}</b> — {xml_escape(exp.company)}"
            if exp.dates:
                header_str += f" &nbsp;<i>({xml_escape(exp.dates)})</i>"
            if exp.location:
                header_str += f" &nbsp;|&nbsp; <i>{xml_escape(exp.location)}</i>"

            story.append(Paragraph(header_str, item_title_style))

            for bullet in exp.bullets:
                story.append(Paragraph(f"&bull; {xml_escape(bullet.tailored)}", bullet_style))

            story.append(Spacer(1, 1.5))

    # 5. Projects
    if data.projects:
        add_section_header("Projects")
        for project in data.projects:
            project_header = f"<b>{xml_escape(project.title)}</b>"
            if project.technologies:
                project_header += f" &nbsp;|&nbsp; <i>{xml_escape(project.technologies)}</i>"
            if project.dates:
                project_header += f" &nbsp;<i>({xml_escape(project.dates)})</i>"

            story.append(Paragraph(project_header, item_title_style))

            if project.description:
                story.append(Paragraph(xml_escape(project.description), item_desc_style))

            for bullet in project.bullets:
                story.append(Paragraph(f"&bull; {xml_escape(bullet.tailored)}", bullet_style))

            story.append(Spacer(1, 1.5))

    # 6. Education
    if data.education:
        add_section_header("Education")
        for edu in data.education:
            education_text = f"<b>{xml_escape(edu.degree)}</b>"
            if edu.institution:
                education_text += f" — {xml_escape(edu.institution)}"
            if edu.dates:
                education_text += f" &nbsp;({xml_escape(edu.dates)})"
            if edu.gpa_or_details:
                education_text += f" &nbsp;|&nbsp; {xml_escape(edu.gpa_or_details)}"

            story.append(Paragraph(education_text, body_style))
        story.append(Spacer(1, 1.5))

    # 7. Certifications
    if data.certifications:
        add_section_header("Certifications")
        for cert in data.certifications:
            cert_text = f"<b>{xml_escape(cert.name)}</b>"
            if cert.issuer:
                cert_text += f" — {xml_escape(cert.issuer)}"
            if cert.date:
                cert_text += f" ({xml_escape(cert.date)})"
            story.append(Paragraph(cert_text, body_style))
        story.append(Spacer(1, 1.5))

    # 8. Additional Sections
    if data.additional_sections:
        for add_sec in data.additional_sections:
            add_section_header(add_sec.heading)
            for item in add_sec.items:
                story.append(Paragraph(f"&bull; {xml_escape(item)}", bullet_style))
            story.append(Spacer(1, 1.5))

    doc.build(story)
    return buf.getvalue()


def generate_tailored_docx(data: TailoredResumeData) -> bytes:
    """
    Generate an editable, ATS-compliant Word document (.docx).
    Preserves all sections, project descriptions, education, and bullet lists with native Word styles.
    """
    doc = Document()

    # Page margins (0.5 inch for optimal ATS spacing)
    for section in doc.sections:
        section.top_margin = Inches(0.5)
        section.bottom_margin = Inches(0.5)
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)

    # Header - Name
    name_p = doc.add_paragraph()
    name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    name_p.paragraph_format.space_after = Pt(2)

    name_run = name_p.add_run(data.contact.name.upper() if data.contact.name else "CANDIDATE")
    name_run.bold = True
    name_run.font.size = Pt(17)
    name_run.font.name = "Calibri"
    name_run.font.color.rgb = RGBColor(15, 23, 42)

    # Contact details
    contact_parts = [
        part
        for part in [
            data.contact.location,
            data.contact.phone,
            data.contact.email,
            data.contact.linkedin,
            data.contact.github,
            data.contact.website or data.contact.portfolio,
        ]
        if part
    ]

    if contact_parts:
        contact_p = doc.add_paragraph()
        contact_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        contact_p.paragraph_format.space_after = Pt(6)

        contact_run = contact_p.add_run(" | ".join(contact_parts))
        contact_run.font.size = Pt(9.5)
        contact_run.font.name = "Calibri"
        contact_run.font.color.rgb = RGBColor(71, 85, 105)

    def add_section_header(title: str) -> None:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(7)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True

        run = p.add_run(title.upper())
        run.bold = True
        run.font.size = Pt(10.5)
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(15, 23, 42)

    # Professional Summary
    if data.professional_summary:
        add_section_header("Professional Summary")
        p = doc.add_paragraph(data.professional_summary)
        p.paragraph_format.space_after = Pt(3)
        for run in p.runs:
            run.font.size = Pt(9.5)
            run.font.name = "Calibri"

    # Technical Skills
    if data.skills_categories:
        add_section_header("Technical Skills")
        for category in data.skills_categories:
            if category.skills:
                p = doc.add_paragraph()
                p.paragraph_format.space_after = Pt(1.5)

                label_run = p.add_run(f"{category.category}: ")
                label_run.bold = True
                label_run.font.size = Pt(9.5)
                label_run.font.name = "Calibri"

                skills_run = p.add_run(", ".join(category.skills))
                skills_run.font.size = Pt(9.5)
                skills_run.font.name = "Calibri"

    # Work Experience
    if data.experience:
        add_section_header("Work Experience")
        for exp in data.experience:
            header = doc.add_paragraph()
            header.paragraph_format.space_before = Pt(3)
            header.paragraph_format.space_after = Pt(1)
            header.paragraph_format.keep_with_next = True

            role_run = header.add_run(f"{exp.role} — {exp.company}")
            role_run.bold = True
            role_run.font.size = Pt(10)
            role_run.font.name = "Calibri"

            if exp.dates:
                dates_run = header.add_run(f"  ({exp.dates})")
                dates_run.italic = True
                dates_run.font.size = Pt(9.5)
                dates_run.font.name = "Calibri"

            for bullet in exp.bullets:
                p = doc.add_paragraph(bullet.tailored, style="List Bullet")
                p.paragraph_format.space_after = Pt(1)
                for run in p.runs:
                    run.font.size = Pt(9.5)
                    run.font.name = "Calibri"

    # Projects
    if data.projects:
        add_section_header("Projects")
        for project in data.projects:
            header = doc.add_paragraph()
            header.paragraph_format.space_before = Pt(3)
            header.paragraph_format.space_after = Pt(1)
            header.paragraph_format.keep_with_next = True

            title_run = header.add_run(project.title)
            title_run.bold = True
            title_run.font.size = Pt(10)
            title_run.font.name = "Calibri"

            if project.technologies:
                tech_run = header.add_run(f" | {project.technologies}")
                tech_run.italic = True
                tech_run.font.size = Pt(9.5)
                tech_run.font.name = "Calibri"

            if project.dates:
                date_run = header.add_run(f" ({project.dates})")
                date_run.font.size = Pt(9)
                date_run.font.name = "Calibri"

            if project.description:
                desc_p = doc.add_paragraph(project.description)
                desc_p.paragraph_format.space_after = Pt(1)
                desc_p.paragraph_format.keep_with_next = True
                for run in desc_p.runs:
                    run.italic = True
                    run.font.size = Pt(9)
                    run.font.name = "Calibri"
                    run.font.color.rgb = RGBColor(71, 85, 105)

            for bullet in project.bullets:
                p = doc.add_paragraph(bullet.tailored, style="List Bullet")
                p.paragraph_format.space_after = Pt(1)
                for run in p.runs:
                    run.font.size = Pt(9.5)
                    run.font.name = "Calibri"

    # Education
    if data.education:
        add_section_header("Education")
        for edu in data.education:
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(2)

            degree_run = p.add_run(f"{edu.degree} — {edu.institution}")
            degree_run.bold = True
            degree_run.font.size = Pt(9.5)
            degree_run.font.name = "Calibri"

            if edu.dates:
                dates_run = p.add_run(f"  ({edu.dates})")
                dates_run.font.size = Pt(9.5)
                dates_run.font.name = "Calibri"

            if edu.gpa_or_details:
                details_run = p.add_run(f" | {edu.gpa_or_details}")
                details_run.font.size = Pt(9.5)
                details_run.font.name = "Calibri"

    # Certifications
    if data.certifications:
        add_section_header("Certifications")
        for cert in data.certifications:
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(1.5)

            name_run = p.add_run(cert.name)
            name_run.bold = True
            name_run.font.size = Pt(9.5)
            name_run.font.name = "Calibri"

            if cert.issuer:
                issuer_run = p.add_run(f" — {cert.issuer}")
                issuer_run.font.size = Pt(9.5)
                issuer_run.font.name = "Calibri"

            if cert.date:
                date_run = p.add_run(f" ({cert.date})")
                date_run.font.size = Pt(9.5)
                date_run.font.name = "Calibri"

    # Additional Sections
    if data.additional_sections:
        for add_sec in data.additional_sections:
            add_section_header(add_sec.heading)
            for item in add_sec.items:
                p = doc.add_paragraph(item, style="List Bullet")
                p.paragraph_format.space_after = Pt(1)
                for run in p.runs:
                    run.font.size = Pt(9.5)
                    run.font.name = "Calibri"

    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


def generate_tailored_markdown(data: TailoredResumeData) -> str:
    """Generate a comprehensive Markdown representation of the complete tailored resume."""
    markdown_lines: list[str] = []

    name = data.contact.name or "Candidate"
    markdown_lines.append(f"# {name}")

    contact_parts = [
        part
        for part in [
            data.contact.location,
            data.contact.phone,
            data.contact.email,
            data.contact.linkedin,
            data.contact.github,
            data.contact.website or data.contact.portfolio,
        ]
        if part
    ]

    if contact_parts:
        markdown_lines.append(f"**{' | '.join(contact_parts)}**\n")

    if data.professional_summary:
        markdown_lines.append("## Professional Summary\n")
        markdown_lines.append(f"{data.professional_summary}\n")

    if data.skills_categories:
        markdown_lines.append("## Technical Skills\n")
        for category in data.skills_categories:
            if category.skills:
                markdown_lines.append(f"- **{category.category}:** {', '.join(category.skills)}")
        markdown_lines.append("")

    if data.experience:
        markdown_lines.append("## Work Experience\n")
        for exp in data.experience:
            dates = f" ({exp.dates})" if exp.dates else ""
            loc = f" | {exp.location}" if exp.location else ""
            markdown_lines.append(f"### {exp.role} — {exp.company}{dates}{loc}\n")
            for bullet in exp.bullets:
                markdown_lines.append(f"- {bullet.tailored}")
            markdown_lines.append("")

    if data.projects:
        markdown_lines.append("## Projects\n")
        for project in data.projects:
            technologies = f" | *{project.technologies}*" if project.technologies else ""
            dates = f" ({project.dates})" if project.dates else ""
            markdown_lines.append(f"### {project.title}{technologies}{dates}\n")
            if project.description:
                markdown_lines.append(f"*{project.description}*\n")
            for bullet in project.bullets:
                markdown_lines.append(f"- {bullet.tailored}")
            markdown_lines.append("")

    if data.education:
        markdown_lines.append("## Education\n")
        for edu in data.education:
            dates = f" ({edu.dates})" if edu.dates else ""
            details = f" | {edu.gpa_or_details}" if edu.gpa_or_details else ""
            markdown_lines.append(f"- **{edu.degree}** — {edu.institution}{dates}{details}")
        markdown_lines.append("")

    if data.certifications:
        markdown_lines.append("## Certifications\n")
        for cert in data.certifications:
            issuer = f" — {cert.issuer}" if cert.issuer else ""
            date_str = f" ({cert.date})" if cert.date else ""
            markdown_lines.append(f"- **{cert.name}**{issuer}{date_str}")
        markdown_lines.append("")

    if data.additional_sections:
        for add_sec in data.additional_sections:
            markdown_lines.append(f"## {add_sec.heading}\n")
            for item in add_sec.items:
                markdown_lines.append(f"- {item}")
            markdown_lines.append("")

    return "\n".join(markdown_lines).strip()
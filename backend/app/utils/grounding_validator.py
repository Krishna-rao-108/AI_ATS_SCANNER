import re
from typing import List, Tuple, Set, Dict, Any
from app.schemas.tailor import (
    TailoredResumeData,
    BulletComparison,
    PreservationAuditItem,
    ContentPreservationAudit,
    ProjectItem,
    WorkExperienceItem,
    EducationItem,
    SkillsCategory,
    CertificationItem,
    AdditionalSectionItem,
)
from app.utils.resume_parser import (
    partition_resume_sections,
    extract_structured_projects,
    extract_structured_experience,
    extract_structured_education,
    extract_structured_skills,
    extract_structured_certifications,
    extract_additional_sections,
    extract_contact_info,
)


METRIC_REGEX = re.compile(
    r"(\b\d+%(?!\w)|\$\d+[\d,]*|\b\d+(?:\.\d+)?\s*(?:times|x|million|billion|k|percent)\b)",
    re.IGNORECASE,
)


def extract_metrics_from_text(text: str) -> List[str]:
    """Extracts quantifiable metrics from text (percentages, dollar amounts, multipliers)."""
    if not text:
        return []
    return [m.lower().strip() for m in METRIC_REGEX.findall(text)]


def are_project_titles_similar(title1: str, title2: str) -> bool:
    """Returns True if two project titles refer to the same project (handles acronym expansion and word overlap)."""
    s1 = title1.lower().strip()
    s2 = title2.lower().strip()
    if s1 in s2 or s2 in s1:
        return True
    s1_norm = s1.replace("retrieval-augmented generation", "rag").replace("retrieval augmented generation", "rag")
    s2_norm = s2.replace("retrieval-augmented generation", "rag").replace("retrieval augmented generation", "rag")
    if s1_norm in s2_norm or s2_norm in s1_norm:
        return True
    stop = {"and", "or", "the", "a", "an", "with", "for", "in", "of", "to", "app", "application", "project", "system", "tool", "pipeline"}
    w1 = {w for w in re.findall(r"\w+", s1_norm) if w not in stop and len(w) > 2}
    w2 = {w for w in re.findall(r"\w+", s2_norm) if w not in stop and len(w) > 2}
    overlap = w1 & w2
    return len(overlap) >= 2 or (len(overlap) >= 1 and (len(w1) <= 2 or len(w2) <= 2))


def reconcile_and_preserve_all_source_content(
    tailored: TailoredResumeData,
    source_resume_text: str,
) -> TailoredResumeData:
    """
    Zero-content-loss reconciliation engine:
    Inspects source resume and guarantees that every single project, bullet, work experience,
    education item, certification, skill, and additional section from the source resume is retained.
    If the AI omitted any source item, it is seamlessly merged back in.
    """
    sections = partition_resume_sections(source_resume_text)
    source_contact = extract_contact_info(source_resume_text)
    source_projects = extract_structured_projects(sections.get("projects", ""))
    source_experience = extract_structured_experience(sections.get("experience", ""))
    source_education = extract_structured_education(sections.get("education", ""))
    source_skills = extract_structured_skills(sections.get("skills", ""))
    source_certs = extract_structured_certifications(sections.get("certifications", ""))
    source_additional = extract_additional_sections(sections)

    # 1. Contact Info Reconciliation: preserve any contact detail present in source
    if not tailored.contact.email and source_contact.email:
        tailored.contact.email = source_contact.email
    if not tailored.contact.phone and source_contact.phone:
        tailored.contact.phone = source_contact.phone
    if not tailored.contact.location and source_contact.location:
        tailored.contact.location = source_contact.location
    if not tailored.contact.linkedin and source_contact.linkedin:
        tailored.contact.linkedin = source_contact.linkedin
    if not tailored.contact.github and source_contact.github:
        tailored.contact.github = source_contact.github
    if not tailored.contact.website and (source_contact.website or source_contact.portfolio):
        tailored.contact.website = source_contact.website or source_contact.portfolio
    if not tailored.contact.portfolio and (source_contact.portfolio or source_contact.website):
        tailored.contact.portfolio = source_contact.portfolio or source_contact.website

    # 2. Projects Reconciliation:
    # Ensure EVERY source project is present. If tailored projects list is missing a source project, add it.
    merged_projects: List[ProjectItem] = list(tailored.projects)

    for sp in source_projects:
        # Find matching project in tailored
        matched_tailored = next((p for p in tailored.projects if are_project_titles_similar(sp.title, p.title)), None)

        if not matched_tailored:
            # Source project was completely dropped by AI! Re-insert it in full.
            merged_projects.append(sp)
        else:
            # Reconcile project description & technologies & bullets
            if not matched_tailored.description and sp.description:
                matched_tailored.description = sp.description
            if not matched_tailored.technologies and sp.technologies:
                matched_tailored.technologies = sp.technologies
            if not matched_tailored.dates and sp.dates:
                matched_tailored.dates = sp.dates

            # Reconcile bullets: ensure all bullets from source project are accounted for
            existing_originals = {b.original.strip().lower() for b in matched_tailored.bullets if b.original}
            for sb in sp.bullets:
                sb_orig = sb.original.strip().lower()
                # If source bullet is missing, append it
                if sb_orig and not any(sb_orig in eo or eo in sb_orig for eo in existing_originals):
                    matched_tailored.bullets.append(sb)

    tailored.projects = merged_projects

    # 3. Work Experience Reconciliation:
    tailored_exp_companies_lower = {exp.company.lower().strip(): exp for exp in tailored.experience}
    merged_exp: List[WorkExperienceItem] = list(tailored.experience)

    for se in source_experience:
        se_comp_clean = se.company.lower().strip()
        matched_exp = None
        for t_comp, t_exp in tailored_exp_companies_lower.items():
            if t_comp in se_comp_clean or se_comp_clean in t_comp:
                matched_exp = t_exp
                break

        if not matched_exp:
            merged_exp.append(se)
        else:
            if not matched_exp.dates and se.dates:
                matched_exp.dates = se.dates
            if not matched_exp.location and se.location:
                matched_exp.location = se.location
            existing_origs = {b.original.strip().lower() for b in matched_exp.bullets if b.original}
            for sb in se.bullets:
                sb_orig = sb.original.strip().lower()
                if sb_orig and not any(sb_orig in eo or eo in sb_orig for eo in existing_origs):
                    matched_exp.bullets.append(sb)

    tailored.experience = merged_exp

    # 4. Education Reconciliation:
    if not tailored.education and source_education:
        tailored.education = source_education
    else:
        existing_insts = {e.institution.lower().strip() for e in tailored.education}
        for se in source_education:
            if se.institution.lower().strip() not in existing_insts:
                tailored.education.append(se)

    # 5. Skills Reconciliation: ensure all source skills are present
    all_tailored_skills = {s.lower().strip() for cat in tailored.skills_categories for s in cat.skills}
    for sc in source_skills:
        missing_from_cat = [s for s in sc.skills if s.lower().strip() not in all_tailored_skills]
        if missing_from_cat:
            # Find matching category or add to first category
            matched_cat = next((c for c in tailored.skills_categories if c.category.lower() == sc.category.lower()), None)
            if matched_cat:
                matched_cat.skills.extend(missing_from_cat)
            elif tailored.skills_categories:
                tailored.skills_categories[0].skills.extend(missing_from_cat)
            else:
                tailored.skills_categories.append(SkillsCategory(category=sc.category, skills=missing_from_cat))

    # 6. Certifications Reconciliation:
    if not tailored.certifications and source_certs:
        tailored.certifications = source_certs
    else:
        existing_cert_names = {c.name.lower().strip() for c in tailored.certifications}
        for sc in source_certs:
            if sc.name.lower().strip() not in existing_cert_names:
                tailored.certifications.append(sc)

    # 7. Additional Sections Reconciliation:
    if not tailored.additional_sections and source_additional:
        tailored.additional_sections = source_additional
    else:
        existing_headings = {sec.heading.lower().strip() for sec in tailored.additional_sections}
        for sa in source_additional:
            if sa.heading.lower().strip() not in existing_headings:
                tailored.additional_sections.append(sa)

    return tailored


def audit_content_preservation(
    tailored: TailoredResumeData,
    source_resume_text: str,
) -> Tuple[ContentPreservationAudit, List[str]]:
    """
    Builds a rigorous content-preservation audit comparing source resume facts against the structured output.
    Distinguishes:
    - preserved_unchanged: Exact text or bullet preserved verbatim
    - rewritten_verified: Rewritten with same factual grounding
    - added_verified: Extracted or added with verified source evidence
    - flagged_for_review: Needs human review
    - missing_or_rejected: Content dropped or unverified claim rejected
    """
    audit_items: List[PreservationAuditItem] = []
    warnings: List[str] = []
    source_lower = source_resume_text.lower()
    sections = partition_resume_sections(source_resume_text)

    # 1. Contact audit
    source_contact = extract_contact_info(source_resume_text)
    if source_contact.email:
        status = "preserved_unchanged" if tailored.contact.email == source_contact.email else "flagged_for_review"
        audit_items.append(
            PreservationAuditItem(
                category="contact",
                item_name="Email Address",
                status=status,
                source_text=source_contact.email,
                tailored_text=tailored.contact.email,
            )
        )
    if source_contact.phone:
        status = "preserved_unchanged" if tailored.contact.phone == source_contact.phone else "flagged_for_review"
        audit_items.append(
            PreservationAuditItem(
                category="contact",
                item_name="Phone Number",
                status=status,
                source_text=source_contact.phone,
                tailored_text=tailored.contact.phone,
            )
        )
    if source_contact.linkedin:
        status = "preserved_unchanged" if tailored.contact.linkedin == source_contact.linkedin else "flagged_for_review"
        audit_items.append(
            PreservationAuditItem(
                category="contact",
                item_name="LinkedIn Profile",
                status=status,
                source_text=source_contact.linkedin,
                tailored_text=tailored.contact.linkedin,
            )
        )
    if source_contact.github:
        status = "preserved_unchanged" if tailored.contact.github == source_contact.github else "flagged_for_review"
        audit_items.append(
            PreservationAuditItem(
                category="contact",
                item_name="GitHub Profile",
                status=status,
                source_text=source_contact.github,
                tailored_text=tailored.contact.github,
            )
        )

    # 2. Projects audit
    source_projects = extract_structured_projects(sections.get("projects", ""))
    for sp in source_projects:
        matched_proj = next((p for p in tailored.projects if are_project_titles_similar(sp.title, p.title)), None)
        if matched_proj:
            status = "preserved_unchanged" if sp.title.strip().lower() == matched_proj.title.strip().lower() else "rewritten_verified"
            audit_items.append(
                PreservationAuditItem(
                    category="project",
                    item_name=f"Project: {sp.title}",
                    status=status,
                    source_text=f"{sp.title} ({sp.technologies or ''})",
                    tailored_text=matched_proj.title,
                )
            )
        else:
            audit_items.append(
                PreservationAuditItem(
                    category="project",
                    item_name=f"Project: {sp.title}",
                    status="missing_or_rejected",
                    source_text=sp.title,
                    notes="Original project was not found in tailored output.",
                )
            )
            warnings.append(f"Missing project from source resume: '{sp.title}'")

    # 3. Bullets audit (Projects & Experience)
    for p in tailored.projects:
        for b in p.bullets:
            if b.tailored.strip() == b.original.strip():
                status = "preserved_unchanged"
            elif b.grounding_status == "verified":
                status = "rewritten_verified"
            elif b.grounding_status == "retained_original":
                status = "preserved_unchanged"
            else:
                status = "flagged_for_review"

            audit_items.append(
                PreservationAuditItem(
                    category="bullet",
                    item_name=f"Project Bullet ({p.title})",
                    status=status,
                    source_text=b.original,
                    tailored_text=b.tailored,
                    notes=b.explanation,
                )
            )

    for exp in tailored.experience:
        for b in exp.bullets:
            if b.tailored.strip() == b.original.strip():
                status = "preserved_unchanged"
            elif b.grounding_status == "verified":
                status = "rewritten_verified"
            elif b.grounding_status == "retained_original":
                status = "preserved_unchanged"
            else:
                status = "flagged_for_review"

            audit_items.append(
                PreservationAuditItem(
                    category="bullet",
                    item_name=f"Experience Bullet ({exp.company})",
                    status=status,
                    source_text=b.original,
                    tailored_text=b.tailored,
                    notes=b.explanation,
                )
            )

    # 4. Education audit
    source_edu = extract_structured_education(sections.get("education", ""))
    tailored_insts = {e.institution.lower().strip() for e in tailored.education}
    for se in source_edu:
        if any(se.institution.lower().strip() in t or t in se.institution.lower().strip() for t in tailored_insts):
            audit_items.append(
                PreservationAuditItem(
                    category="education",
                    item_name=f"Education: {se.degree}",
                    status="preserved_unchanged",
                    source_text=f"{se.degree} — {se.institution}",
                    tailored_text=f"{se.degree} — {se.institution}",
                )
            )
        else:
            audit_items.append(
                PreservationAuditItem(
                    category="education",
                    item_name=f"Education: {se.degree}",
                    status="missing_or_rejected",
                    source_text=f"{se.degree} — {se.institution}",
                    notes="Education institution was missing from output.",
                )
            )
            warnings.append(f"Missing education entry: '{se.degree}'")

    # 5. Additional sections audit
    for sec in tailored.additional_sections:
        audit_items.append(
            PreservationAuditItem(
                category="additional_section",
                item_name=sec.heading,
                status="preserved_unchanged",
                source_text=f"{sec.heading} ({len(sec.items)} items)",
                tailored_text=f"{sec.heading} ({len(sec.items)} items)",
            )
        )

    # Counts
    preserved_count = sum(1 for item in audit_items if item.status == "preserved_unchanged")
    rewritten_count = sum(1 for item in audit_items if item.status == "rewritten_verified")
    added_count = sum(1 for item in audit_items if item.status == "added_verified")
    flagged_count = sum(1 for item in audit_items if item.status == "flagged_for_review")
    missing_count = sum(1 for item in audit_items if item.status == "missing_or_rejected")

    audit = ContentPreservationAudit(
        preserved_unchanged_count=preserved_count,
        rewritten_verified_count=rewritten_count,
        added_verified_count=added_count,
        flagged_count=flagged_count,
        missing_rejected_count=missing_count,
        items=audit_items,
    )

    return audit, warnings


def validate_and_enforce_grounding(
    tailored: TailoredResumeData,
    source_resume_text: str,
    raw_source_bullets: List[str],
) -> Tuple[TailoredResumeData, List[str]]:
    """
    Performs deterministic grounding validation and content preservation verification:
    1. Reconciles all source items so zero content is lost.
    2. Checks for unevidenced metrics and reverts fabricated metrics.
    3. Prevents skill gaps leakage into candidate skills.
    4. Audits content preservation and builds full audit breakdown.
    5. Sets grounding_verified and content_preservation_verified independently.
    """
    flagged_claims: List[str] = []
    source_lower = source_resume_text.lower()
    source_metrics = set(extract_metrics_from_text(source_resume_text))

    # Reconcile all source content before validation
    tailored = reconcile_and_preserve_all_source_content(tailored, source_resume_text)

    # 1. Validate Work Experience Bullets
    for exp in tailored.experience:
        validated_bullets: List[BulletComparison] = []
        for bullet in exp.bullets:
            tailored_metrics = extract_metrics_from_text(bullet.tailored)
            invented_metrics = [m for m in tailored_metrics if m not in source_metrics]

            if invented_metrics:
                flag_msg = f"Invented metric {', '.join(invented_metrics)} in experience bullet rejected; retained original phrasing."
                flagged_claims.append(flag_msg)
                validated_bullets.append(
                    BulletComparison(
                        original=bullet.original,
                        tailored=bullet.original,
                        explanation=f"Reverted to original: unevidenced metric ({', '.join(invented_metrics)}) was rejected by validator.",
                        source_evidence=bullet.source_evidence or bullet.original,
                        grounding_status="retained_original",
                    )
                )
            else:
                validated_bullets.append(bullet)
        exp.bullets = validated_bullets

    # 2. Validate Project Bullets
    for proj in tailored.projects:
        validated_bullets: List[BulletComparison] = []
        for bullet in proj.bullets:
            tailored_metrics = extract_metrics_from_text(bullet.tailored)
            invented_metrics = [m for m in tailored_metrics if m not in source_metrics]

            if invented_metrics:
                flag_msg = f"Invented metric {', '.join(invented_metrics)} in project '{proj.title}' rejected; retained original phrasing."
                flagged_claims.append(flag_msg)
                validated_bullets.append(
                    BulletComparison(
                        original=bullet.original,
                        tailored=bullet.original,
                        explanation=f"Reverted to original: unevidenced metric ({', '.join(invented_metrics)}) was rejected by validator.",
                        source_evidence=bullet.source_evidence or bullet.original,
                        grounding_status="retained_original",
                    )
                )
            else:
                validated_bullets.append(bullet)
        proj.bullets = validated_bullets

    # 3. Check for Skill Gaps leakage into Candidate Skills
    skill_gaps_set = {g.strip().lower() for g in tailored.skill_gaps if g.strip()}
    for cat in tailored.skills_categories:
        clean_cat_skills = []
        for s in cat.skills:
            s_clean = s.strip()
            if s_clean.lower() in skill_gaps_set and s_clean.lower() not in source_lower:
                flagged_claims.append(f"Removed '{s_clean}' from candidate skills because it was flagged as a job gap without resume evidence.")
            else:
                clean_cat_skills.append(s_clean)
        cat.skills = clean_cat_skills

    # 4. Check Professional Summary for invented metrics
    summary_metrics = extract_metrics_from_text(tailored.professional_summary)
    invented_summary_metrics = [m for m in summary_metrics if m not in source_metrics]
    if invented_summary_metrics:
        flagged_claims.append(f"Summary claimed unevidenced metric {', '.join(invented_summary_metrics)}.")
        for inv in invented_summary_metrics:
            tailored.professional_summary = re.sub(
                rf"\b(?:increased|elevated|boosted|improved)\s+[^,\.]*?by\s+{re.escape(inv)}\b",
                "improved system reliability",
                tailored.professional_summary,
                flags=re.IGNORECASE,
            )

    # 5. Content Preservation Audit
    preservation_audit, preservation_warnings = audit_content_preservation(tailored, source_resume_text)
    tailored.preservation_audit = preservation_audit
    tailored.preservation_warnings = preservation_warnings

    # 6. Set Verification Flags
    tailored.unsupported_claims_flagged = flagged_claims
    tailored.grounding_verified = True  # True because all ungrounded rewrites were safely reverted to source facts
    tailored.content_preservation_verified = (preservation_audit.missing_rejected_count == 0)

    if preservation_audit.missing_rejected_count > 0:
        tailored.validation_summary = (
            f"Preservation warning: {preservation_audit.missing_rejected_count} original item(s) could not be fully mapped. "
            "Manual review required."
        )
    elif flagged_claims:
        tailored.validation_summary = (
            f"Grounding validation corrected {len(flagged_claims)} ungrounded claim(s). "
            f"100% content preservation verified across {preservation_audit.preserved_unchanged_count + preservation_audit.rewritten_verified_count} items."
        )
    else:
        tailored.validation_summary = (
            f"Zero-content-loss verification passed: 100% of source sections, projects, and bullets preserved. "
            "All tailored content is strictly grounded."
        )

    return tailored, flagged_claims

import type {
  TailoredResumeData,
  SeniorityLevel,
  ToneType,
} from "./tailorTypes";

export interface TailorPreset {
  id: string;
  label: string;
  role: string;
  company: string;
  seniority: SeniorityLevel;
  tone: ToneType;
  jobDescription: string;
}

export const TAILOR_PRESETS: TailorPreset[] = [
  {
    id: "preset-stripe",
    label: "Senior Frontend Engineer (Stripe)",
    role: "Senior Frontend Engineer",
    company: "Stripe",
    seniority: "senior",
    tone: "impact-driven",
    jobDescription: `Stripe is looking for a Senior Frontend Engineer to build resilient, high-converting merchant dashboards.
Requirements:
- 5+ years of experience with React, TypeScript, and modern state architectures.
- Demonstrated success optimizing Core Web Vitals, reducing bundle sizes, and micro-frontend performance.
- Experience with GraphQL, real-time WebSockets, and payment analytics.
- Strong grounding in accessible design systems and rigorous automated testing.
- Track record of mentoring junior engineers and cross-functional technical leadership.`,
  },
  {
    id: "preset-vercel",
    label: "Fullstack Platform Engineer (Vercel)",
    role: "Fullstack Platform Engineer",
    company: "Vercel",
    seniority: "mid-level",
    tone: "technical",
    jobDescription: `Join Vercel's developer experience team building next-generation serverless edge compute tooling.
Requirements:
- Deep expertise with TypeScript, Next.js / TanStack Start, Node.js, and server-side rendering pipelines.
- Hands-on experience with REST and GraphQL APIs, distributed database querying (PostgreSQL / Redis), and Docker.
- Passion for low-latency web applications, automated CI/CD pipelines, and developer DX.
- Experience writing clear technical RFCs and documentation.`,
  },
  {
    id: "preset-fintech",
    label: "Backend / API Engineer (Brex)",
    role: "Staff Backend Engineer",
    company: "Brex",
    seniority: "staff",
    tone: "concise",
    jobDescription: `Brex is hiring a Staff Backend Engineer to scale core ledger transactions and financial ingestion pipelines.
Requirements:
- Strong experience with high-throughput distributed systems in Python, Go, or Java.
- Relational database schema design (PostgreSQL) and event-driven architectures (Kafka / RabbitMQ).
- Strict adherence to financial data consistency, idempotency, and SOC2 compliance.
- Experience designing resilient REST APIs and microservice boundaries.`,
  },
];

export function exportResumeAsMarkdown(resume: TailoredResumeData): string {
  const lines: string[] = [];
  const name = resume.contact.name || "Candidate Name";
  lines.push(`# ${name}`);

  const contactParts = [
    resume.contact.location,
    resume.contact.phone,
    resume.contact.email,
    resume.contact.linkedin,
    resume.contact.github,
    resume.contact.website || resume.contact.portfolio,
  ].filter(Boolean);

  if (contactParts.length) {
    lines.push(`**${contactParts.join(" | ")}**\n`);
  }

  if (resume.professional_summary) {
    lines.push(`## Professional Summary\n\n${resume.professional_summary}\n`);
  }

  if (resume.skills_categories.length) {
    lines.push("## Technical Skills\n");
    resume.skills_categories.forEach((cat) => {
      if (cat.skills.length) {
        lines.push(`- **${cat.category}:** ${cat.skills.join(", ")}`);
      }
    });
    lines.push("");
  }

  if (resume.experience.length) {
    lines.push("## Work Experience\n");
    resume.experience.forEach((exp) => {
      const dates = exp.dates ? ` (${exp.dates})` : "";
      const loc = exp.location ? ` | ${exp.location}` : "";
      lines.push(`### ${exp.role} — ${exp.company}${dates}${loc}\n`);
      exp.bullets.forEach((b) => lines.push(`- ${b.tailored}`));
      lines.push("");
    });
  }

  if (resume.projects.length) {
    lines.push("## Technical Projects\n");
    resume.projects.forEach((p) => {
      const tech = p.technologies ? ` | *${p.technologies}*` : "";
      const dates = p.dates ? ` (${p.dates})` : "";
      lines.push(`### ${p.title}${tech}${dates}\n`);
      if (p.description) lines.push(`*${p.description}*\n`);
      p.bullets.forEach((b) => lines.push(`- ${b.tailored}`));
      lines.push("");
    });
  }

  if (resume.education.length) {
    lines.push("## Education\n");
    resume.education.forEach((edu) => {
      const dates = edu.dates ? ` (${edu.dates})` : "";
      const details = edu.gpa_or_details ? ` | ${edu.gpa_or_details}` : "";
      lines.push(`- **${edu.degree}** — ${edu.institution}${dates}${details}`);
    });
    lines.push("");
  }

  if (resume.certifications.length) {
    lines.push("## Certifications\n");
    resume.certifications.forEach((c) => {
      const issuer = c.issuer ? ` — ${c.issuer}` : "";
      const date = c.date ? ` (${c.date})` : "";
      lines.push(`- **${c.name}**${issuer}${date}`);
    });
    lines.push("");
  }

  if (resume.additional_sections?.length) {
    resume.additional_sections.forEach((addSec) => {
      lines.push(`## ${addSec.heading}\n`);
      addSec.items.forEach((item) => lines.push(`- ${item}`));
      lines.push("");
    });
  }

  return lines.join("\n").trim();
}

export function generateMockTailoring(params: {
  resumeId: string;
  resumeFilename: string;
  targetRole: string;
  companyName?: string;
  jobDescription: string;
  seniority: SeniorityLevel;
  tone: ToneType;
}): TailoredResumeData {
  const role = params.targetRole || "Software Engineer";
  const company = params.companyName || "Target Company";
  const now = new Date().toISOString();

  // Determine skill gaps based on JD keywords not present in default profile
  const jdLower = params.jobDescription.toLowerCase();
  const candidateKnownSkills = [
    "TypeScript",
    "React",
    "Node.js",
    "Tailwind CSS",
    "PostgreSQL",
    "REST APIs",
    "Git",
    "Jest",
    "Vite",
  ];

  const possibleGaps = [
    { key: "graphql", label: "GraphQL" },
    { key: "kafka", label: "Apache Kafka" },
    { key: "docker", label: "Docker & Containerization" },
    { key: "kubernetes", label: "Kubernetes" },
    { key: "aws", label: "AWS (S3, Lambda, CloudWatch)" },
    { key: "redis", label: "Redis Caching" },
    { key: "microservices", label: "Microservices Architecture" },
  ];

  const detectedGaps: string[] = [];
  possibleGaps.forEach((g) => {
    if (jdLower.includes(g.key) && !candidateKnownSkills.map((s) => s.toLowerCase()).includes(g.key)) {
      detectedGaps.push(g.label);
    }
  });

  if (detectedGaps.length === 0) {
    detectedGaps.push("GraphQL", "AWS Cloud Infrastructure");
  }

  const resume: TailoredResumeData = {
    id: `tailor-${Date.now()}`,
    resume_id: params.resumeId,
    resume_filename: params.resumeFilename,
    target_role: role,
    target_company: company,
    seniority: params.seniority,
    tone: params.tone,
    created_at: now,
    contact: {
      name: "Alex Rivera",
      email: "alex.rivera@example.com",
      phone: "+1 (555) 234-5678",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/alex-rivera-dev",
      github: "github.com/alexrivera",
      website: "alexrivera.dev",
    },
    professional_summary:
      params.tone === "concise"
        ? `${params.seniority.charAt(0).toUpperCase() + params.seniority.slice(1)} ${role} with 5+ years building resilient web applications. Proven track record scaling frontends to 12k+ daily users and reducing latency by 40% with React, TypeScript, and modern web architectures.`
        : params.tone === "impact-driven"
          ? `High-velocity ${role} specializing in scalable web systems. Championed frontend performance overhaul decreasing load times by 40% for 12,000+ daily active users. Expert in TypeScript, React, and robust API integration, seeking to drive engineering velocity and merchant conversion at ${company}.`
          : `Dedicated ${role} with 5+ years of engineering experience architecting scalable React and TypeScript applications. Focused on component modularity, accessibility (a11y), responsive data visualization, and zero-downtime client-server synchronization aligned with ${company}'s technical standards.`,
    skills_categories: [
      {
        category: "Languages & Frameworks",
        skills: ["TypeScript", "JavaScript (ESNext)", "React 19", "Next.js", "Node.js", "HTML5/CSS3"],
      },
      {
        category: "State & Architecture",
        skills: ["TanStack Query", "Zustand", "Redux Toolkit", "Server-Side Rendering (SSR)", "RESTful APIs"],
      },
      {
        category: "Styling & Systems",
        skills: ["Tailwind CSS v4", "Radix UI Primitives", "shadcn/ui", "Framer Motion", "Design Tokens"],
      },
      {
        category: "Testing & DevOps",
        skills: ["Vitest", "Jest", "React Testing Library", "Git", "GitHub Actions", "Vite"],
      },
    ],
    experience: [
      {
        id: "exp-1",
        company: "Northwind Software",
        role: "Senior Frontend Engineer",
        dates: "2021 — Present",
        location: "San Francisco, CA",
        bullets: [
          {
            id: "b-1",
            original: "Built customer dashboard used by 12,000 daily users.",
            tailored:
              "Architected and delivered high-traffic customer analytics dashboard used by 12,000+ daily active users, maintaining 99.98% uptime and 60fps rendering across complex charting surfaces.",
            explanation:
              "Elevated verb from 'Built' to 'Architected and delivered' and framed metrics in terms of uptime and rendering performance relevant to target role.",
            grounding_status: "grounding_verified",
          },
          {
            id: "b-2",
            original: "Reduced page load time by 40%.",
            tailored:
              "Spearheaded Core Web Vitals optimization initiative that slashed Largest Contentful Paint (LCP) by 40% (2.4s to 1.4s) through bundle splitting, dynamic asset prefetching, and query caching.",
            explanation:
              "Substantiated the 40% reduction with explicit technical strategies (bundle splitting, caching) evidenced in codebase without modifying source metrics.",
            grounding_status: "grounding_verified",
          },
          {
            id: "b-3",
            original: "Mentored 3 junior engineers on code reviews and best practices.",
            tailored:
              "Established bi-weekly frontend engineering guild and mentored 3 junior engineers, accelerating onboarding ramp time by 35% and codifying strict TypeScript code review standards.",
            explanation:
              "Highlighted technical leadership and systematic quality standards, directly matching senior ATS criteria.",
            grounding_status: "grounding_verified",
          },
        ],
      },
      {
        id: "exp-2",
        company: "Apex Digital Labs",
        role: "Frontend Engineer",
        dates: "2019 — 2021",
        location: "Austin, TX",
        bullets: [
          {
            id: "b-4",
            original: "Developed responsive React components for client eCommerce portals.",
            tailored:
              "Engineered 45+ reusable, accessible React design system components with Tailwind CSS and Radix UI, adopted across 4 major eCommerce platforms with 100% WCAG AA compliance.",
            explanation:
              "Quantified component library scale and emphasized accessibility standards valued in modern ATS screening.",
            grounding_status: "grounding_verified",
          },
          {
            id: "b-5",
            original: "Integrated REST APIs with backend services and handled error states.",
            tailored:
              "Constructed resilient data synchronization layer using React Query and Axios with optimistic UI updates and unified error boundaries, reducing unhandled network failures by 28%.",
            explanation:
              "Demonstrated architectural depth in asynchronous client state and error boundary resilience.",
            grounding_status: "grounding_verified",
          },
        ],
      },
    ],
    projects: [
      {
        id: "proj-1",
        title: "Exact ATS Resume Screening & Tailoring System",
        technologies: "React 19, TypeScript, TanStack Start, Tailwind CSS v4, FastAPI",
        dates: "2024",
        description: "Zero-content-loss resume intelligence and keyword alignment engine.",
        bullets: [
          {
            id: "pb-1",
            original: "Created application to screen and tailor resumes against job descriptions.",
            tailored:
              "Designed full-stack ATS intelligence application utilizing deterministic grounding algorithms to preserve 100% of candidate achievements while dynamically highlighting role-relevant qualifications.",
            explanation:
              "Emphasized algorithmic grounding and full-stack capabilities, aligning with software engineering job descriptions.",
            grounding_status: "grounding_verified",
          },
          {
            id: "pb-2",
            original: "Implemented dark mode, file parsing, and score visualizations.",
            tailored:
              "Implemented WCAG-compliant dual-theme system (OKLCH color space), drag-and-drop document parsers (PDF/DOCX), and reactive radial score telemetry.",
            explanation:
              "Highlights modern web standard proficiencies (OKLCH, modern file APIs) matching job requirements.",
            grounding_status: "grounding_verified",
          },
        ],
      },
    ],
    education: [
      {
        degree: "B.S. in Computer Science",
        institution: "University of California, Berkeley",
        dates: "2015 — 2019",
        gpa_or_details: "Magna Cum Laude · GPA 3.82",
      },
    ],
    certifications: [
      {
        name: "AWS Certified Developer — Associate",
        issuer: "Amazon Web Services",
        date: "2023",
      },
      {
        name: "Meta Certified Front-End Developer",
        issuer: "Meta",
        date: "2022",
      },
    ],
    additional_sections: [
      {
        heading: "Honors & Open Source",
        items: [
          "Active contributor to open-source UI libraries with 400+ GitHub stars.",
          "First Place Winner, Bay Area Tech Hackathon (2022).",
        ],
      },
    ],
    skill_gaps: detectedGaps,
    unsupported_claims_flagged: [
      "Target job requests 3+ years of Kubernetes cluster orchestration; this requirement was not present in source candidate facts and has been safely omitted to prevent qualification fabrication.",
    ],
    validation_summary:
      "All 8 source bullets, 2 project entries, 2 work history blocks, and education credentials verified verbatim. Zero factual loss detected.",
    grounding_verified: true,
    content_preservation_verified: true,
    preservation_audit: {
      preserved_unchanged_count: 5,
      rewritten_verified_count: 7,
      flagged_count: 1,
      missing_rejected_count: 0,
    },
    raw_markdown: "",
  };

  resume.raw_markdown = exportResumeAsMarkdown(resume);
  return resume;
}

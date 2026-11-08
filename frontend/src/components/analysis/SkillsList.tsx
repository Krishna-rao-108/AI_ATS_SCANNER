import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, AlertOctagon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface SkillsListProps {
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
  isGeneral?: boolean;
}

export const SkillsList: React.FC<SkillsListProps> = ({
  matchedSkills,
  missingSkills,
  strengths,
  gaps,
  isGeneral = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Matched Skills / Identified Skills */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>
                {isGeneral ? `Identified Skills (${matchedSkills.length})` : `Matched Skills (${matchedSkills.length})`}
              </CardTitle>
              <CardDescription>
                {isGeneral
                  ? 'Demonstrable competencies & tools extracted from resume text'
                  : 'Verified competencies identified in both documents'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {matchedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="success"
                  size="md"
                  icon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-ink-300)] italic">
              {isGeneral
                ? 'No specific skills detected in current evaluation.'
                : 'No exact matched skills detected in current evaluation.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Missing Skills / Areas for Improvement */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>
                {isGeneral
                  ? `Areas for Improvement (${missingSkills.length})`
                  : `Missing Requirements (${missingSkills.length})`}
              </CardTitle>
              <CardDescription>
                {isGeneral
                  ? 'Identified weaknesses and structural areas to refine'
                  : 'Keywords in job description absent from resume text'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {missingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="danger"
                  size="md"
                  icon={<AlertTriangle className="w-3 h-3 text-rose-600" />}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All primary requirements appear represented in candidate resume!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border border-[var(--color-violet-100)] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Core Profile Strengths</CardTitle>
              <CardDescription>High-impact qualifications highlighted by ATS screening</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {strengths.length > 0 ? (
            <ul className="space-y-3">
              {strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--color-ink-700)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-violet-600)] mt-2 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--color-ink-300)] italic">No specific strengths isolated in response.</p>
          )}
        </CardContent>
      </Card>

      {/* Identified Gaps */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Identified Experience Gaps</CardTitle>
              <CardDescription>Areas where candidate scope diverges from job listing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {gaps.length > 0 ? (
            <ul className="space-y-3">
              {gaps.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--color-ink-700)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No substantial scope or experience gaps flagged.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

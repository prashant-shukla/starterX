export const COMPANY_STAGE_TABS = ['onboarding', 'catch-up', 'monthly'] as const;
export type CompanyStageTabKey = (typeof COMPANY_STAGE_TABS)[number];

const STAGE_PATTERNS: { key: CompanyStageTabKey; match: RegExp }[] = [
  { key: 'onboarding', match: /onboard/i },
  { key: 'catch-up', match: /catch[ _-]?up/i },
  { key: 'monthly', match: /monthly/i }
];

export function getStageTabFromStage(stage?: string | null): CompanyStageTabKey {
  if (!stage) return COMPANY_STAGE_TABS[0];
  const normalized = String(stage).trim().toLowerCase();
  for (const entry of STAGE_PATTERNS) {
    if (entry.match.test(normalized)) {
      return entry.key;
    }
  }
  return COMPANY_STAGE_TABS[0];
}

export function isStageTab(tab?: string | null): tab is CompanyStageTabKey {
  return COMPANY_STAGE_TABS.includes(tab as CompanyStageTabKey);
}

export function getEntityDetailPath(basePath: string, entitySegment: string, entityId: string, tab?: string): string {
  const resolvedTab = tab || COMPANY_STAGE_TABS[0];
  return `${basePath}/${entitySegment}/${entityId}/${resolvedTab}`;
}

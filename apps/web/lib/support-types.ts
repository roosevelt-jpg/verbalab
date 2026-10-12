export type ForumCategory =
  | 'api-integration'
  | 'billing'
  | 'speech'
  | 'ideas'
  | 'troubleshooting';

export const FORUM_CATEGORIES: ForumCategory[] = [
  'api-integration',
  'billing',
  'speech',
  'ideas',
  'troubleshooting',
];

export const FORUM_CATEGORY_LABELS: Record<ForumCategory, string> = {
  'api-integration': 'API integration',
  billing: 'Billing & plans',
  speech: 'Speech & voices',
  ideas: 'Ideas',
  troubleshooting: 'Troubleshooting',
};

export function isForumCategory(value: string): value is ForumCategory {
  return FORUM_CATEGORIES.includes(value as ForumCategory);
}

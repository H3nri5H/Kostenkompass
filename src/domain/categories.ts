import type { Category } from '@/domain/models';

export type CategoryScope = 'expense' | 'asset';

export interface CategoryNode extends Category {
  parentId: string | null;
  isSelectable: boolean;
  expenseEnabled: boolean;
  assetEnabled: boolean;
  searchTerms: string[];
}

export interface CategoryGroup {
  root: CategoryNode;
  children: CategoryNode[];
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de-DE')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function compareCategories(left: CategoryNode, right: CategoryNode): number {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'de');
}

export function groupCategories(categories: CategoryNode[]): CategoryGroup[] {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const roots = categories
    .filter((category) => category.parentId === null || !categoryMap.has(category.parentId))
    .sort(compareCategories);

  return roots
    .map((root) => {
      const children = categories
        .filter((category) => category.parentId === root.id && category.isSelectable)
        .sort(compareCategories);
      return { root, children: children.length > 0 ? children : root.isSelectable ? [root] : [] };
    })
    .filter((group) => group.children.length > 0);
}

export function getCategoryRoot(
  categories: CategoryNode[],
  categoryId: string | null,
): CategoryNode | null {
  if (!categoryId) return null;

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  let current = categoryMap.get(categoryId) ?? null;
  const visited = new Set<string>();

  while (current?.parentId && !visited.has(current.id)) {
    visited.add(current.id);
    const parent = categoryMap.get(current.parentId);
    if (!parent) break;
    current = parent;
  }

  return current;
}

export function getCategoryBreadcrumb(
  categories: CategoryNode[],
  categoryId: string | null,
): string | null {
  if (!categoryId) return null;

  const category = categories.find((item) => item.id === categoryId);
  if (!category) return null;

  const root = getCategoryRoot(categories, categoryId);
  return root && root.id !== category.id ? `${root.name} › ${category.name}` : category.name;
}

export function searchCategories(categories: CategoryNode[], query: string): CategoryNode[] {
  const normalizedQuery = normalizeSearchValue(query);
  const selectable = categories.filter((category) => category.isSelectable);

  if (!normalizedQuery) return selectable.sort(compareCategories);

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const queryParts = normalizedQuery.split(' ').filter(Boolean);

  return selectable
    .filter((category) => {
      const parent = category.parentId ? categoryMap.get(category.parentId) : null;
      const haystack = normalizeSearchValue(
        [category.name, parent?.name ?? '', ...(parent?.searchTerms ?? []), ...category.searchTerms].join(' '),
      );
      return queryParts.every((part) => haystack.includes(part));
    })
    .sort((left, right) => {
      const leftRoot = left.parentId ? categoryMap.get(left.parentId) : left;
      const rightRoot = right.parentId ? categoryMap.get(right.parentId) : right;
      return (
        (leftRoot?.sortOrder ?? left.sortOrder) - (rightRoot?.sortOrder ?? right.sortOrder) ||
        compareCategories(left, right)
      );
    });
}

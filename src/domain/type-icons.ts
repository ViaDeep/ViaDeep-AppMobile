import type { IconName } from '@/ui/icon';

import type { IncidentType } from './incident';

export const TYPE_ICONS: Record<IncidentType, IconName> = {
  D00: 'height',
  D10: 'swap-horiz',
  D20: 'grid-on',
  D40: 'report-problem',
};

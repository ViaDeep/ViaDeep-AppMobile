import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Props = { name: IconName; size?: number; color: string };

/** Íconos Material, los mismos que usan los mockups de Figma. */
export function Icon({ name, size = 18, color }: Props) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

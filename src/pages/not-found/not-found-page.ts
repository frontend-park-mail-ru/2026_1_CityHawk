import { renderTemplate } from '../../app/templates/renderer.js';
import type { RouteContext } from '../../types/router.js';

export function notFoundPage({ path }: RouteContext): string {
  return renderTemplate('not-found', { path });
}

import { QueryClient } from '@tanstack/react-query';

// Create per provider instance so static rendering does not share query data.
export function createQueryClient() {
  return new QueryClient();
}

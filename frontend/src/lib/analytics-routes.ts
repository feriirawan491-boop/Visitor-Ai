export const managementViews=['overview','visitors','duration','performance','reports'] as const;
export type ManagementView=typeof managementViews[number];

export const PANORAMAS = [
  { id: 'day', label: 'Day View', sceneId: '0-dji_0001_terrace-150' },
  { id: 'evening', label: 'Evening View', sceneId: '2-dji_0071_d' },
];

export const PANORAMA_BY_ID = Object.fromEntries(PANORAMAS.map((p) => [p.id, p]));

export const hasPanoramas = PANORAMAS.some((p) => p.sceneId);
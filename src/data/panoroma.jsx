export const PANORAMAS = [
  { id: 'day', label: 'Day View', sceneId: '2-dji_0010_180m' },
  { id: 'evening', label: 'Evening View', sceneId: '1-dji_0158_180m' },
];

export const PANORAMA_BY_ID = Object.fromEntries(PANORAMAS.map((p) => [p.id, p]));

export const hasPanoramas = PANORAMAS.some((p) => p.sceneId);
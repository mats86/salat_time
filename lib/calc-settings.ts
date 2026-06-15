export type AsrSchool = 'standard' | 'hanafi';

export type LatitudeAdjustment = 'middle_of_night' | 'one_seventh' | 'angle_based';

export interface LatitudeAdjustOption {
  id: LatitudeAdjustment;
  labelKey: 'latAdjustMiddleOfNight' | 'latAdjustOneSeventh' | 'latAdjustAngleBased';
  descKey:
    | 'latAdjustMiddleOfNightDesc'
    | 'latAdjustOneSeventhDesc'
    | 'latAdjustAngleBasedDesc';
}

export const LATITUDE_ADJUST_OPTIONS: LatitudeAdjustOption[] = [
  {
    id: 'middle_of_night',
    labelKey: 'latAdjustMiddleOfNight',
    descKey: 'latAdjustMiddleOfNightDesc',
  },
  { id: 'one_seventh', labelKey: 'latAdjustOneSeventh', descKey: 'latAdjustOneSeventhDesc' },
  { id: 'angle_based', labelKey: 'latAdjustAngleBased', descKey: 'latAdjustAngleBasedDesc' },
];

export interface CalcMethodOption {
  id: number;
  labelKey:
    | 'calcMethodMWL'
    | 'calcMethodISNA'
    | 'calcMethodEgypt'
    | 'calcMethodUmmAlQura'
    | 'calcMethodKarachi';
}

export const CALC_METHOD_OPTIONS: CalcMethodOption[] = [
  { id: 3, labelKey: 'calcMethodMWL' },
  { id: 2, labelKey: 'calcMethodISNA' },
  { id: 5, labelKey: 'calcMethodEgypt' },
  { id: 4, labelKey: 'calcMethodUmmAlQura' },
  { id: 1, labelKey: 'calcMethodKarachi' },
];

export interface CalcSettings {
  method: number;
  school: AsrSchool;
  latitudeAdjust: LatitudeAdjustment;
}

const METHOD_KEY = 'sz_calc_method';
const SCHOOL_KEY = 'sz_calc_school';
const LATITUDE_ADJUST_KEY = 'sz_calc_latitude_adjust';

const DEFAULT_METHOD =
  Number(process.env.NEXT_PUBLIC_ALADHAN_METHOD) || 3;

const DEFAULT_LATITUDE_ADJUST: LatitudeAdjustment = 'middle_of_night';

export function asrSchoolToApi(school: AsrSchool): number {
  return school === 'hanafi' ? 1 : 0;
}

export function apiSchoolToAsr(school: number): AsrSchool {
  return school === 1 ? 'hanafi' : 'standard';
}

export function latitudeAdjustToApi(adjust: LatitudeAdjustment): number {
  const map: Record<LatitudeAdjustment, number> = {
    middle_of_night: 1,
    one_seventh: 2,
    angle_based: 3,
  };
  return map[adjust];
}

export function getDefaultCalcSettings(): CalcSettings {
  return {
    method: DEFAULT_METHOD,
    school: 'standard',
    latitudeAdjust: DEFAULT_LATITUDE_ADJUST,
  };
}

export function getCalcSettings(): CalcSettings {
  if (typeof window === 'undefined') {
    return getDefaultCalcSettings();
  }

  const storedMethod = localStorage.getItem(METHOD_KEY);
  const storedSchool = localStorage.getItem(SCHOOL_KEY);

  const method = storedMethod != null ? Number(storedMethod) : DEFAULT_METHOD;
  const validMethod = CALC_METHOD_OPTIONS.some((m) => m.id === method)
    ? method
    : DEFAULT_METHOD;

  const school =
    storedSchool === 'hanafi' || storedSchool === 'standard'
      ? storedSchool
      : 'standard';

  const storedAdjust = localStorage.getItem(LATITUDE_ADJUST_KEY);
  const latitudeAdjust = LATITUDE_ADJUST_OPTIONS.some((o) => o.id === storedAdjust)
    ? (storedAdjust as LatitudeAdjustment)
    : DEFAULT_LATITUDE_ADJUST;

  return { method: validMethod, school, latitudeAdjust };
}

function dispatchCalcSettingsChanged(): void {
  window.dispatchEvent(new Event('calc-settings-changed'));
}

export function setCalcMethod(method: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(METHOD_KEY, String(method));
  dispatchCalcSettingsChanged();
}

export function setAsrSchool(school: AsrSchool): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCHOOL_KEY, school);
  dispatchCalcSettingsChanged();
}

export function setLatitudeAdjustment(adjust: LatitudeAdjustment): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LATITUDE_ADJUST_KEY, adjust);
  dispatchCalcSettingsChanged();
}

export function getCalcMethodOption(methodId: number): CalcMethodOption | undefined {
  return CALC_METHOD_OPTIONS.find((m) => m.id === methodId);
}

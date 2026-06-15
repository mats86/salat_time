export type AsrSchool = 'standard' | 'hanafi';

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
}

const METHOD_KEY = 'sz_calc_method';
const SCHOOL_KEY = 'sz_calc_school';

const DEFAULT_METHOD =
  Number(process.env.NEXT_PUBLIC_ALADHAN_METHOD) || 3;

export function asrSchoolToApi(school: AsrSchool): number {
  return school === 'hanafi' ? 1 : 0;
}

export function apiSchoolToAsr(school: number): AsrSchool {
  return school === 1 ? 'hanafi' : 'standard';
}

export function getDefaultCalcSettings(): CalcSettings {
  return { method: DEFAULT_METHOD, school: 'standard' };
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

  return { method: validMethod, school };
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

export function getCalcMethodOption(methodId: number): CalcMethodOption | undefined {
  return CALC_METHOD_OPTIONS.find((m) => m.id === methodId);
}

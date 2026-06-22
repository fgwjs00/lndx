export interface TimeSlotLike {
  day?: string | number
  weekday?: string | number
  dayOfWeek?: string | number
  start?: string
  end?: string
  startTime?: string
  endTime?: string
  time?: string
}

export interface ClassSectionChoice {
  id: string
  name?: string
  major?: string
  timeSlots?: TimeSlotLike[] | unknown
}

export interface InsuranceCoverageInput {
  coverageStart?: string | Date | null
  coverageEnd?: string | Date | null
  requiredStart: string | Date
  requiredEnd: string | Date
}

export interface EnrollmentApplicationPolicyInput {
  choices: ClassSectionChoice[]
  insurance?: InsuranceCoverageInput | null
}

export interface EnrollmentPolicyResult {
  isValid: boolean
  errors: string[]
}

interface NormalizedTimeSlot {
  day: string
  startMinutes: number
  endMinutes: number
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDateKey(value: string | Date | null | undefined): string | null {
  const date = toDate(value)
  return date ? date.toISOString().slice(0, 10) : null
}

function parseTimeToMinutes(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  const match = value.match(/(\d{1,2}):(\d{2})/)
  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    return null
  }

  return hours * 60 + minutes
}

function splitTimeRange(value: string | undefined): { start?: string; end?: string } {
  if (!value) {
    return {}
  }

  const [start, end] = value.split(/[-~—至]/).map(part => part.trim())
  return { start, end }
}

function normalizeTimeSlot(slot: TimeSlotLike): NormalizedTimeSlot | null {
  const range = splitTimeRange(slot.time)
  const start = slot.startTime || slot.start || range.start
  const end = slot.endTime || slot.end || range.end
  const startMinutes = parseTimeToMinutes(start)
  const endMinutes = parseTimeToMinutes(end)
  const day = String(slot.dayOfWeek ?? slot.weekday ?? slot.day ?? '').trim()

  if (!day || startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
    return null
  }

  return { day, startMinutes, endMinutes }
}

function normalizeTimeSlots(value: TimeSlotLike[] | unknown): NormalizedTimeSlot[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map(slot => normalizeTimeSlot(slot as TimeSlotLike))
    .filter((slot): slot is NormalizedTimeSlot => Boolean(slot))
}

function overlaps(a: NormalizedTimeSlot, b: NormalizedTimeSlot): boolean {
  return a.day === b.day && a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes
}

export function hasTimeSlotConflict(left: TimeSlotLike[] | unknown, right: TimeSlotLike[] | unknown): boolean {
  const leftSlots = normalizeTimeSlots(left)
  const rightSlots = normalizeTimeSlots(right)

  return leftSlots.some(leftSlot => rightSlots.some(rightSlot => overlaps(leftSlot, rightSlot)))
}

export function validateInsuranceCoverage(input: InsuranceCoverageInput): EnrollmentPolicyResult {
  const coverageStart = toDate(input.coverageStart)
  const coverageEnd = toDate(input.coverageEnd)
  const requiredStart = toDate(input.requiredStart)
  const requiredEnd = toDate(input.requiredEnd)
  const coverageStartKey = toDateKey(input.coverageStart)
  const coverageEndKey = toDateKey(input.coverageEnd)
  const requiredStartKey = toDateKey(input.requiredStart)
  const requiredEndKey = toDateKey(input.requiredEnd)
  const errors: string[] = []

  if (!coverageStart || !coverageEnd) {
    errors.push('请上传并填写保险有效期')
  }

  if (!requiredStart || !requiredEnd) {
    errors.push('学年保险要求配置不完整')
  }

  if (coverageStartKey && coverageEndKey && coverageStartKey > coverageEndKey) {
    errors.push('保险开始日期不能晚于结束日期')
  }

  if (coverageStartKey && coverageEndKey && requiredStartKey && requiredEndKey) {
    if (coverageStartKey > requiredStartKey || coverageEndKey < requiredEndKey) {
      errors.push('保险有效期必须覆盖本学年报名要求')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateEnrollmentApplication(input: EnrollmentApplicationPolicyInput): EnrollmentPolicyResult {
  const errors: string[] = []
  const { choices } = input

  if (choices.length < 1) {
    errors.push('请至少选择一个专业')
  }

  if (choices.length > 2) {
    errors.push('每名学员每学期最多只能选择两个专业')
  }

  const duplicateIds = new Set<string>()
  const seenIds = new Set<string>()
  for (const choice of choices) {
    if (seenIds.has(choice.id)) {
      duplicateIds.add(choice.id)
    }
    seenIds.add(choice.id)
  }

  if (duplicateIds.size > 0) {
    errors.push('不能重复选择同一个班级')
  }

  for (let i = 0; i < choices.length; i += 1) {
    for (let j = i + 1; j < choices.length; j += 1) {
      if (hasTimeSlotConflict(choices[i].timeSlots, choices[j].timeSlots)) {
        errors.push('所选专业上课时间冲突')
      }
    }
  }

  if (input.insurance) {
    const insuranceResult = validateInsuranceCoverage(input.insurance)
    errors.push(...insuranceResult.errors)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

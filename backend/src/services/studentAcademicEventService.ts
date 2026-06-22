export const STUDENT_ACADEMIC_EVENT_TYPES = {
  GRADE_ADJUSTMENT: 'GRADE_ADJUSTMENT',
  RETENTION: 'RETENTION',
  MAJOR_CHANGE: 'MAJOR_CHANGE'
} as const

export type StudentAcademicEventType =
  typeof STUDENT_ACADEMIC_EVENT_TYPES[keyof typeof STUDENT_ACADEMIC_EVENT_TYPES]

export interface RecordStudentAcademicEventInput {
  studentId: string
  eventType: StudentAcademicEventType
  fromValue?: string | null
  toValue?: string | null
  reason?: string | null
  operatorId?: string | null
  metadata?: Record<string, unknown>
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed || null
}

export async function recordStudentAcademicEvent(
  tx: any,
  input: RecordStudentAcademicEventInput
): Promise<any> {
  return tx.studentAcademicEvent.create({
    data: {
      studentId: input.studentId,
      eventType: input.eventType,
      fromValue: normalizeOptionalText(input.fromValue),
      toValue: normalizeOptionalText(input.toValue),
      reason: normalizeOptionalText(input.reason),
      operatorId: normalizeOptionalText(input.operatorId),
      metadata: input.metadata || undefined
    }
  })
}

export const formatGender = (gender?: string | null): string => {
  switch (String(gender || '').trim().toUpperCase()) {
    case 'MALE':
    case 'M':
    case '1':
    case '男':
      return '男'
    case 'FEMALE':
    case 'F':
    case '2':
    case '女':
      return '女'
    case 'OTHER':
    case '其他':
      return '其他'
    default:
      return '未填写'
  }
}

export const formatSeasonName = (season?: string | null): string => {
  switch (String(season || '').trim().toLowerCase()) {
    case 'spring':
      return '春季'
    case 'summer':
      return '夏季'
    case 'autumn':
    case 'fall':
      return '秋季'
    case 'winter':
      return '冬季'
    default:
      return String(season || '').trim()
  }
}

export const formatClassSectionCode = (value?: string | null): string => {
  const text = String(value || '').trim()
  if (!text) return '未设置编号'

  const generatedCode = text.match(/^(\d{4})-(spring|summer|autumn|fall|winter)(?:-.+)?$/i)
  if (generatedCode) {
    return `${generatedCode[1]}年${formatSeasonName(generatedCode[2])}班`
  }

  return text
    .replace(/\bspring\b/gi, '春季')
    .replace(/\bsummer\b/gi, '夏季')
    .replace(/\bautumn\b/gi, '秋季')
    .replace(/\bfall\b/gi, '秋季')
    .replace(/\bwinter\b/gi, '冬季')
    .replace(/-/g, ' · ')
}

export const formatAcademicYearName = (value?: string | null): string => {
  const text = String(value || '').trim()
  if (!text) return '未设置学年'

  const yearRange = text.match(/(\d{4})\s*[-~—至]\s*(\d{4})/i)
  if (yearRange) {
    return `${yearRange[1]}-${yearRange[2]}学年`
  }

  return text
    .replace(/\bacademic\s+year\b/gi, '学年')
    .replace(/\bschool\s+year\b/gi, '学年')
    .replace(/\s+/g, '')
}

export interface AttachmentLike {
  attachmentUrl?: string | null
  attachmentName?: string | null
}

export const hasUsableAttachment = (record: AttachmentLike): boolean => {
  const url = String(record.attachmentUrl || '').trim()
  const name = String(record.attachmentName || '').trim()
  const source = `${url} ${name}`.toLowerCase()

  return Boolean(url) && !source.includes('default-avatar') && !source.includes('default-idcard')
}

export const formatAttachmentLabel = (_record?: AttachmentLike): string => {
  return '查看凭证'
}

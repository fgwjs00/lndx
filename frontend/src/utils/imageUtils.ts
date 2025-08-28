/**
 * 图片URL工具函数
 * @description 统一处理图片URL的构造和处理
 */

/**
 * 后端服务器地址配置
 * 开发环境：localhost:3000
 * 生产环境：ln.tuojiayi.com 或从环境变量获取
 */
const getBackendBaseUrl = (): string => {
  // 开发环境
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:3000'
  }
  
  // 生产环境，可以从环境变量获取
  return import.meta.env.VITE_BACKEND_URL || 'http://ln.tuojiayi.com'
}

/**
 * 构造完整的图片URL
 * @param imagePath 图片路径
 * @returns 完整的图片URL
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  // 空值处理
  if (!imagePath) {
    return `${getBackendBaseUrl()}/uploads/id-cards/default-avatar.svg`
  }

  // 如果已经是完整的URL（http开头），直接返回
  if (imagePath.startsWith('http')) {
    return imagePath
  }

  // 如果是base64数据，直接返回
  if (imagePath.startsWith('data:')) {
    return imagePath
  }

  // 构造完整URL
  const backendUrl = getBackendBaseUrl()
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  
  return `${backendUrl}${cleanPath}`
}

/**
 * 构造身份证照片URL
 * @param cardPath 身份证照片路径
 * @param type 类型：'front' | 'back'
 * @returns 完整的身份证照片URL
 */
export function getIdCardUrl(cardPath: string | null | undefined, type: 'front' | 'back' = 'front'): string {
  if (!cardPath) {
    // 返回默认占位图
    return `${getBackendBaseUrl()}/uploads/id-cards/default-idcard-${type}.svg`
  }

  return getImageUrl(cardPath)
}

/**
 * 构造头像照片URL
 * @param photoPath 头像路径
 * @returns 完整的头像URL
 */
export function getAvatarUrl(photoPath: string | null | undefined): string {
  if (!photoPath) {
    return `${getBackendBaseUrl()}/uploads/id-cards/default-avatar.svg`
  }

  return getImageUrl(photoPath)
}

/**
 * 处理图片加载错误的统一方法
 * @param event 错误事件
 * @param type 图片类型：'avatar' | 'idcard-front' | 'idcard-back'
 */
export function handleImageError(event: Event, type: 'avatar' | 'idcard-front' | 'idcard-back' = 'avatar'): void {
  const img = event.target as HTMLImageElement | null
  if (!img) return

  // 避免无限循环：如果已经是默认图片了，就不再替换
  if (img.src.includes('default-avatar.svg') || img.src.includes('default-idcard')) {
    return
  }

  // 根据类型设置对应的默认图片
  switch (type) {
    case 'avatar':
      img.src = getAvatarUrl(null)
      break
    case 'idcard-front':
      img.src = getIdCardUrl(null, 'front')
      break
    case 'idcard-back':
      img.src = getIdCardUrl(null, 'back')
      break
  }
}

/**
 * 检查图片是否可访问
 * @param imageUrl 图片URL
 * @returns Promise<boolean>
 */
export function checkImageAvailable(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = imageUrl
  })
}

export default {
  getImageUrl,
  getIdCardUrl,
  getAvatarUrl,
  checkImageAvailable
}

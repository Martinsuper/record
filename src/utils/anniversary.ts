/**
 * 纪念日时间计算工具
 */

export interface AnniversaryCalcResult {
  isFuture: boolean      // 是否未发生（倒计时）
  days: number           // 天数
  displayText: string    // 显示文本
  nextDate: number       // 下次日期时间戳
}

/**
 * 获取今年同一天的时间戳
 * @param originalDate 原始日期时间戳
 * @returns 今年同一天 00:00:00 的时间戳
 */
export function getThisYearDate(originalDate: number): number {
  const date = new Date(originalDate)
  const thisYear = new Date().getFullYear()
  const thisYearDate = new Date(thisYear, date.getMonth(), date.getDate())
  return thisYearDate.getTime()
}

/**
 * 获取明年同一天的时间戳
 * @param originalDate 原始日期时间戳
 * @returns 明年同一天 00:00:00 的时间戳
 */
export function getNextYearDate(originalDate: number): number {
  const date = new Date(originalDate)
  const nextYear = new Date().getFullYear() + 1
  const nextYearDate = new Date(nextYear, date.getMonth(), date.getDate())
  return nextYearDate.getTime()
}

/**
 * 计算纪念日
 * @param date 原始日期时间戳
 * @param repeatType 重复类型
 * @returns 计算结果
 */
export function calculateAnniversary(
  date: number,
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day' = 'year'
): AnniversaryCalcResult {
  const now = Date.now()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()

  // 对于年重复
  if (repeatType === 'year') {
    const thisYearDate = getThisYearDate(date)

    if (thisYearDate >= todayTimestamp) {
      // 今年还未过
      const days = Math.ceil((thisYearDate - todayTimestamp) / (24 * 60 * 60 * 1000))
      return {
        isFuture: true,
        days,
        displayText: formatDaysText(days, true),
        nextDate: thisYearDate
      }
    } else {
      // 今年已过，计算明年
      const nextYearDate = getNextYearDate(date)
      const days = Math.ceil((nextYearDate - todayTimestamp) / (24 * 60 * 60 * 1000))
      return {
        isFuture: true,
        days,
        displayText: formatDaysText(days, true),
        nextDate: nextYearDate
      }
    }
  }

  // 不重复：判断是否已过
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  const targetTimestamp = targetDate.getTime()

  if (targetTimestamp >= todayTimestamp) {
    // 未发生
    const days = Math.ceil((targetTimestamp - todayTimestamp) / (24 * 60 * 60 * 1000))
    return {
      isFuture: true,
      days,
      displayText: formatDaysText(days, true),
      nextDate: targetTimestamp
    }
  } else {
    // 已发生，显示正计时
    const days = Math.floor((todayTimestamp - targetTimestamp) / (24 * 60 * 60 * 1000))
    return {
      isFuture: false,
      days,
      displayText: formatDaysText(days, false),
      nextDate: targetTimestamp
    }
  }
}

/**
 * 格式化天数显示文本
 * @param days 天数
 * @param isFuture 是否未发生
 * @returns 显示文本
 */
export function formatDaysText(days: number, isFuture: boolean): string {
  if (isFuture) {
    // 倒计时
    if (days === 0) return '今天'
    if (days === 1) return '明天'
    return `还有 ${days} 天`
  } else {
    // 正计时
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    return `已经 ${days} 天`
  }
}

/**
 * 格式化日期显示
 * @param timestamp 时间戳
 * @returns 格式化后的日期字符串
 */
export function formatAnniversaryDate(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

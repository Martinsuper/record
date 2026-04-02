/**
 * 纪念日时间计算工具
 */
import type { AnniversaryData } from './storage'

export interface AnniversaryCalcResult {
  mode: 'countdown' | 'elapsed'  // 显示模式
  days: number                   // 天数
  displayText: string            // 显示文本
  nextDate: number               // 下次日期时间戳
}

export interface UpcomingAnniversary {
  id: string
  name: string
  days: number        // 剩余天数（0=今天，负数=已过）
  displayText: string // 显示文本
  mode: 'countdown' | 'elapsed'
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
 * @param mode 显示模式：countdown(倒计时) | elapsed(正计时)
 * @param repeatType 重复类型
 * @returns 计算结果
 */
export function calculateAnniversary(
  date: number,
  mode: 'countdown' | 'elapsed' = 'countdown',
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day' = 'year'
): AnniversaryCalcResult {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()

  // 正计时模式：计算从首次日期到现在的天数
  if (mode === 'elapsed') {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    const targetTimestamp = targetDate.getTime()
    const days = Math.floor((todayTimestamp - targetTimestamp) / (24 * 60 * 60 * 1000))
    return {
      mode: 'elapsed',
      days,
      displayText: formatDaysText(days, 'elapsed'),
      nextDate: targetTimestamp
    }
  }

  // 倒计时模式：计算到下次日期的天数
  // 对于年重复
  if (repeatType === 'year') {
    const thisYearDate = getThisYearDate(date)

    if (thisYearDate >= todayTimestamp) {
      // 今年还未过
      const days = Math.ceil((thisYearDate - todayTimestamp) / (24 * 60 * 60 * 1000))
      return {
        mode: 'countdown',
        days,
        displayText: formatDaysText(days, 'countdown'),
        nextDate: thisYearDate
      }
    } else {
      // 今年已过，计算明年
      const nextYearDate = getNextYearDate(date)
      const days = Math.ceil((nextYearDate - todayTimestamp) / (24 * 60 * 60 * 1000))
      return {
        mode: 'countdown',
        days,
        displayText: formatDaysText(days, 'countdown'),
        nextDate: nextYearDate
      }
    }
  }

  // 每月重复
  if (repeatType === 'month') {
    const originalDate = new Date(date)
    const thisMonthDate = new Date(today.getFullYear(), today.getMonth(), originalDate.getDate())
    thisMonthDate.setHours(0, 0, 0, 0)
    const thisMonthTimestamp = thisMonthDate.getTime()

    if (thisMonthTimestamp >= todayTimestamp) {
      // 本月还未过
      const days = Math.ceil((thisMonthTimestamp - todayTimestamp) / (24 * 60 * 60 * 1000))
      return {
        mode: 'countdown',
        days,
        displayText: formatDaysText(days, 'countdown'),
        nextDate: thisMonthTimestamp
      }
    } else {
      // 本月已过，计算下月
      const nextMonth = today.getMonth() + 1
      const nextYear = nextMonth > 11 ? today.getFullYear() + 1 : today.getFullYear()
      const adjustedMonth = nextMonth > 11 ? 0 : nextMonth
      const nextMonthDate = new Date(nextYear, adjustedMonth, originalDate.getDate())
      nextMonthDate.setHours(0, 0, 0, 0)
      const days = Math.ceil((nextMonthDate.getTime() - todayTimestamp) / (24 * 60 * 60 * 1000))
      return {
        mode: 'countdown',
        days,
        displayText: formatDaysText(days, 'countdown'),
        nextDate: nextMonthDate.getTime()
      }
    }
  }

  // 每周重复
  if (repeatType === 'week') {
    const originalDate = new Date(date)
    const targetDayOfWeek = originalDate.getDay()
    const todayDayOfWeek = today.getDay()

    // 计算到下一次目标星期几的天数
    let daysUntilTarget = targetDayOfWeek - todayDayOfWeek
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7
    }
    if (daysUntilTarget === 0) {
      // 今天就是目标星期几，检查是否已过（简单处理：当天都显示"今天")
      const targetDate = new Date(today)
      targetDate.setHours(0, 0, 0, 0)
      return {
        mode: 'countdown',
        days: 0,
        displayText: '今天',
        nextDate: targetDate.getTime()
      }
    }

    const nextDate = new Date(todayTimestamp + daysUntilTarget * 24 * 60 * 60 * 1000)
    return {
      mode: 'countdown',
      days: daysUntilTarget,
      displayText: formatDaysText(daysUntilTarget, 'countdown'),
      nextDate: nextDate.getTime()
    }
  }

  // 每天重复
  if (repeatType === 'day') {
    // 每天重复意味着明天又是一个新的纪念日
    const tomorrow = new Date(todayTimestamp + 24 * 60 * 60 * 1000)
    return {
      mode: 'countdown',
      days: 1,
      displayText: '明天',
      nextDate: tomorrow.getTime()
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
      mode: 'countdown',
      days,
      displayText: formatDaysText(days, 'countdown'),
      nextDate: targetTimestamp
    }
  } else {
    // 已发生，显示正计时
    const days = Math.floor((todayTimestamp - targetTimestamp) / (24 * 60 * 60 * 1000))
    return {
      mode: 'elapsed',
      days,
      displayText: formatDaysText(days, 'elapsed'),
      nextDate: targetTimestamp
    }
  }
}

/**
 * 格式化天数显示文本
 * @param days 天数
 * @param mode 显示模式
 * @returns 显示文本
 */
export function formatDaysText(days: number, mode: 'countdown' | 'elapsed'): string {
  if (mode === 'countdown') {
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

/**
 * 获取即将到来的纪念日
 * @param anniversaries 纪念日列表
 * @param daysRange 范围天数（默认3）
 * @returns 筛选后的列表，按天数排序
 */
export function getUpcomingAnniversaries(
  anniversaries: AnniversaryData[],
  daysRange: number = 3
): UpcomingAnniversary[] {
  const result: UpcomingAnniversary[] = []

  for (const anniversary of anniversaries) {
    const calc = calculateAnniversary(anniversary.date, anniversary.mode, anniversary.repeatType)

    // 只关注倒计时模式，且在范围内
    if (calc.mode === 'countdown' && calc.days >= 0 && calc.days <= daysRange) {
      result.push({
        id: anniversary.id,
        name: anniversary.name,
        days: calc.days,
        displayText: calc.displayText,
        mode: calc.mode
      })
    }
  }

  // 按天数升序排序
  return result.sort((a, b) => a.days - b.days)
}
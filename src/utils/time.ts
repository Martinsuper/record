/**
 * 时间格式化工具
 */

export interface EventWithTime {
  time: number
}

export interface DayInfo {
  date: string
  label: string
  timestamp: number
}

/**
 * 格式化日期时间
 */
export function formatTime(timestamp: number | Date, format = 'YYYY-MM-DD HH:mm'): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)

  if (isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取今天的开始时间戳
 */
export function getTodayStart(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.getTime()
}

/**
 * 获取本周开始时间戳（周一）
 */
export function getWeekStart(): number {
  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  today.setHours(0, 0, 0, 0)
  today.setDate(today.getDate() - dayOfWeek + 1)
  return today.getTime()
}

/**
 * 获取本月开始时间戳
 */
export function getMonthStart(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  today.setDate(1)
  return today.getTime()
}

/**
 * 根据时间范围筛选事件
 */
export function filterByTimeRange<T extends EventWithTime>(events: T[], range: 'all' | 'today' | 'week' | 'month'): T[] {
  if (range === 'all') {
    return events
  }

  let startTime: number
  switch (range) {
    case 'today':
      startTime = getTodayStart()
      break
    case 'week':
      startTime = getWeekStart()
      break
    case 'month':
      startTime = getMonthStart()
      break
    default:
      return events
  }

  return events.filter(event => event.time >= startTime)
}

/**
 * 获取近 N 天的日期列表
 */
export function getRecentDays(n = 7): DayInfo[] {
  const result: DayInfo[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    result.push({
      date: formatTime(date, 'MM-DD'),
      timestamp: date.getTime(),
      label: i === 0 ? '今天' : i === 1 ? '昨天' : formatTime(date, 'MM-DD')
    })
  }

  return result
}

/**
 * 检查时间戳是否在指定日期内
 */
export function isSameDay(timestamp: number, dateTimestamp: number): boolean {
  const dateEnd = dateTimestamp + 24 * 60 * 60 * 1000
  return timestamp >= dateTimestamp && timestamp < dateEnd
}
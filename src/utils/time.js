/**
 * 时间格式化工具
 */

/**
 * 格式化日期时间
 * @param {number|Date} timestamp 时间戳(ms) 或 Date 对象
 * @param {string} format 格式模板，默认 'YYYY-MM-DD HH:mm'
 * @returns {string} 格式化后的字符串
 */
export function formatTime(timestamp, format = 'YYYY-MM-DD HH:mm') {
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
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取今天的开始时间戳
 * @returns {number} 今天 00:00:00 的时间戳(ms)
 */
export function getTodayStart() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.getTime()
}

/**
 * 获取本周开始时间戳（周一）
 * @returns {number} 本周一 00:00:00 的时间戳(ms)
 */
export function getWeekStart() {
  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  today.setHours(0, 0, 0, 0)
  today.setDate(today.getDate() - dayOfWeek + 1)
  return today.getTime()
}

/**
 * 获取本月开始时间戳
 * @returns {number} 本月 1 日 00:00:00 的时间戳(ms)
 */
export function getMonthStart() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  today.setDate(1)
  return today.getTime()
}

/**
 * 根据时间范围筛选事件
 * @param {Array} events 事件列表
 * @param {string} range 范围类型: 'all', 'today', 'week', 'month'
 * @returns {Array} 筛选后的事件列表
 */
export function filterByTimeRange(events, range) {
  if (range === 'all') {
    return events
  }

  let startTime
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
 * @param {number} n 天数
 * @returns {Array<{date: string, label: string, timestamp: number}>} 日期列表
 */
export function getRecentDays(n = 7) {
  const result = []
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
 * @param {number} timestamp 时间戳(ms)
 * @param {number} dateTimestamp 日期开始时间戳(ms)
 * @returns {boolean}
 */
export function isSameDay(timestamp, dateTimestamp) {
  const dateEnd = dateTimestamp + 24 * 60 * 60 * 1000
  return timestamp >= dateTimestamp && timestamp < dateEnd
}
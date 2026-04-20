export function getNowInZone(timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]))
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

function getOffsetMinutes(date, timeZone) {
  const offsetString = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value

  const match = offsetString?.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/)
  if (!match) {
    return 0
  }

  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2] ?? 0)
  const minutes = Number(match[3] ?? 0)
  return sign * (hours * 60 + minutes)
}

export function zoneDateMinuteToUtcMs(dateText, minuteOfDay, timeZone) {
  const [year, month, day] = dateText.split('-').map(Number)
  const hours = Math.floor(minuteOfDay / 60)
  const minutes = minuteOfDay % 60

  let utcGuess = Date.UTC(year, month - 1, day, hours, minutes)
  const firstOffset = getOffsetMinutes(new Date(utcGuess), timeZone)
  utcGuess -= firstOffset * 60_000
  const secondOffset = getOffsetMinutes(new Date(utcGuess), timeZone)
  return Date.UTC(year, month - 1, day, hours, minutes) - secondOffset * 60_000
}

export function formatMinuteLabel(minuteOfDay) {
  const hours = Math.floor(minuteOfDay / 60)
  const minutes = minuteOfDay % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

export function utcMsToZoneDateMinute(utcMs, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(formatter.formatToParts(new Date(utcMs)).map((part) => [part.type, part.value]))
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

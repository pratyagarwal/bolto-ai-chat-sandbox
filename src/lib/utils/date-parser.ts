export function parseRelativeDate(dateString: string): string {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  const today = new Date();
  const normalizedInput = dateString.toLowerCase().trim();
  
  // Handle "immediately" or similar
  if (normalizedInput === 'immediately' || normalizedInput === 'today' || normalizedInput === 'now') {
    return today.toISOString().split('T')[0];
  }
  
  // Handle "tomorrow"
  if (normalizedInput === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Handle "next [day]" format
  const nextDayMatch = normalizedInput.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextDayMatch) {
    const targetDay = nextDayMatch[1];
    const dayMap: { [key: string]: number } = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
      thursday: 4, friday: 5, saturday: 6
    };
    
    const targetDayNum = dayMap[targetDay];
    const currentDayNum = today.getDay();
    
    // Calculate days until next occurrence
    let daysUntil = targetDayNum - currentDayNum;
    if (daysUntil <= 0) {
      daysUntil += 7; // Next week
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    return nextDate.toISOString().split('T')[0];
  }
  
  // Handle "next week"
  if (normalizedInput === 'next week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }
  
  // Handle "next month"
  if (normalizedInput === 'next month') {
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  }
  
  // Handle "end of week" (Friday)
  if (normalizedInput === 'end of week' || normalizedInput === 'end of the week') {
    const friday = new Date(today);
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
    friday.setDate(today.getDate() + daysUntilFriday);
    return friday.toISOString().split('T')[0];
  }
  
  // Handle "end of month"
  if (normalizedInput === 'end of month' || normalizedInput === 'end of the month') {
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return endOfMonth.toISOString().split('T')[0];
  }
  
  // Try to parse as ISO date (YYYY-MM-DD)
  const isoMatch = normalizedInput.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // Try to parse MM/DD/YYYY or MM-DD-YYYY
  const usDateMatch = normalizedInput.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (usDateMatch) {
    const [, month, day, year] = usDateMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // If we can't parse it, return the original string
  return dateString;
}

export function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}
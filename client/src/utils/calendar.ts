export function getGoogleCalendarWebUrl(action: {
  title: string;
  due_date: string;
  description?: string;
  document_title?: string;
}): string {
  if (!action.due_date) return 'https://calendar.google.com';

  const start = action.due_date.replace(/-/g, '');
  const dateObj = new Date(action.due_date);
  dateObj.setDate(dateObj.getDate() + 1);
  const end = dateObj.toISOString().slice(0, 10).replace(/-/g, '');

  const text = `[LifeAdmin] ${action.title}`;
  const details = `${action.description || 'Important LifeAdmin Deadline'}\n\nDocument: ${action.document_title || ''}\nManaged via LifeAdmin Personal Document Platform`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates: `${start}/${end}`,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

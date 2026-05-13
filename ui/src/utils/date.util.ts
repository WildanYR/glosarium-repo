export function formatDateIdStandard(date?: Date) {
  if (!date)
    return '';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}
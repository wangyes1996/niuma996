export function formatToBeijing(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const opts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai'
  };

  // toLocaleString with zh-CN gives YYYY/MM/DD HH:MM:SS — normalize slashes to dashes
  const localized = d.toLocaleString('zh-CN', opts);
  return localized.replace(/\//g, '-');
}

export default formatToBeijing;

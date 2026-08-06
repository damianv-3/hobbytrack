export function timeAgo(dateString)
{
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 }
  ];

  for (const interval of intervals)
  {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1)
    {
      return `${count}${interval.label} ago`;
    }
  }

  return 'just now';
}
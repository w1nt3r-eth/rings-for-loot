export default function extractErrorMessage(error: any): string {
  const message = error?.error?.message || error?.message || null;
  if (!message) {
    return message || '';
  }

  return message.replace('execution reverted: ', '').substr(0, 120);
}

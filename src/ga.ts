type EventProps = {
  eventCategory: string;
  eventAction: string;
  eventLabel?: string;
  eventValue?: number;
  fieldsObject?: object;
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  sendEvent: (e: EventProps) => {
    if (typeof window !== undefined && typeof (window as any).ga === 'function') {
      (window as any).ga('send', {hitType: 'event', ...e});
    }
  },
};

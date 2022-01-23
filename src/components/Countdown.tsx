export default function Countdown({delta}: {delta: number}) {
  return (
    <div>
      {delta <= 0 ? <p className="live">LIVE</p> : <p className="countdown">{formatTimeLeft(delta)}</p>}
      <style jsx>{`
        p {
          margin: 0;
          font-size: 32px;
          line-height: 44px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
        .countdown {
          color: #e5bf72;
        }
        .live {
          color: #e66045;
        }
      `}</style>
    </div>
  );
}

function formatTimeLeft(delta: number) {
  const days = Math.floor(delta / (24 * 60 * 60 * 1000));
  const hours = Math.floor(delta / (60 * 60 * 1000)) % 24;
  const minutes = Math.floor(delta / (60 * 1000)) % 60;
  const seconds = Math.floor(delta / 1000) % 60;

  let result = `${hours}\u00A0hours ${minutes}\u00A0minutes ${seconds}\u00A0seconds`;
  if (days) {
    result = `${days}\u00A0days ${result}`;
  }

  return result;
}

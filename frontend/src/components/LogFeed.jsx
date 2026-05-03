/**
 * LogFeed — renders SIEM/EDR log lines with colour-coded severity.
 */
export default function LogFeed({ logs = [] }) {
  function getLineClass(line) {
    const upper = line.toUpperCase()
    if (upper.includes('ALERT') || upper.includes('CRITICAL')) return 'log-line-alert'
    if (upper.includes('WARN')) return 'log-line-warn'
    if (upper.includes('INFO') || upper.includes('ALLOW')) return 'log-line-success'
    return 'log-line-default'
  }

  return (
    <div className="log-feed">
      {logs.length === 0 ? (
        <span className="log-line-default">No log data available.</span>
      ) : (
        logs.map((line, i) => (
          <div key={i} className={getLineClass(line)}>
            {line}
          </div>
        ))
      )}
    </div>
  )
}

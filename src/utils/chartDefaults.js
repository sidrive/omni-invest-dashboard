export function buildChartOptions(tooltipFormatter) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 12, 16, 0.95)',
        borderColor: '#232d42',
        borderWidth: 1,
        titleColor: '#8899bb',
        bodyColor: '#e8edf5',
        titleFont: { family: "'JetBrains Mono', monospace", size: 10 },
        bodyFont:  { family: "'JetBrains Mono', monospace", size: 12 },
        padding: 10,
        callbacks: tooltipFormatter ?? {}
      }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      line:  { tension: 0.4, borderWidth: 1.5 },
      point: { radius: 0, hoverRadius: 4, hitRadius: 20 }
    },
    animation: { duration: 600, easing: 'easeInOutQuart' }
  }
}

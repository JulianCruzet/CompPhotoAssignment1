import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface HistogramProps {
  imageData: ImageData
}

export default function Histogram({ imageData }: HistogramProps) {
  const histogramData = calculateHistogram(imageData)

  const data = {
    labels: Array.from({ length: 256 }, (_, i) => i),
    datasets: [
      {
        label: 'Histogram',
        data: histogramData,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Image Histogram',
      },
    },
  }

  return <Line options={options} data={data} />
}

function calculateHistogram(imageData: ImageData): number[] {
  const histogram = new Array(256).fill(0)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const avg = Math.round((r + g + b) / 3)
    histogram[avg]++
  }

  return histogram
}
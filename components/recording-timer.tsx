export default function RecordingTimer({ seconds }: { seconds: number }) {
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const pad = (num: number) => num.toString().padStart(2, "0")

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    }

    return `${pad(minutes)}:${pad(seconds)}`
  }

  return <span>{formatTime(seconds)}</span>
}

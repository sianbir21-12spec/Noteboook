import { useEffect, useState } from 'react'

export function useNotificationPermission() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported')
    }
  }, [])

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return 'unsupported'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  return { permission, requestPermission }
}

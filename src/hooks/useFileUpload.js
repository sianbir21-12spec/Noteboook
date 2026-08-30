import { useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

export function useFileUpload() {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const uploadFile = (file, threadId) => {
    return new Promise((resolve, reject) => {
      setUploading(true)
      const path = `uploads/${threadId}/${Date.now()}_${file.name}`
      const storageRef = ref(storage, path)
      const task = uploadBytesResumable(storageRef, file)

      task.on(
        'state_changed',
        (snap) => {
          setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
        },
        (err) => {
          setUploading(false)
          reject(err)
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref)
          setUploading(false)
          setProgress(0)
          resolve({ url, name: file.name })
        }
      )
    })
  }

  return { uploadFile, progress, uploading }
}

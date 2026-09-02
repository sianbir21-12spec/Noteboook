import { useState, useEffect, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/csv', 'text/markdown',
  'application/json', 'application/zip',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const FILE_TYPE_LABELS = {
  'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/jpg': 'JPG',
  'image/gif': 'GIF', 'image/webp': 'WebP', 'image/svg+xml': 'SVG',
  'application/pdf': 'PDF', 'text/plain': 'Text', 'text/csv': 'CSV',
  'text/markdown': 'Markdown', 'application/json': 'JSON', 'application/zip': 'ZIP',
}

export function useFileUpload() {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const currentTaskRef = useRef(null)
  const currentFileRef = useRef(null)

  // Cleanup on unmount - cancel upload if in progress
  useEffect(() => {
    return () => {
      if (currentTaskRef.current) {
        try {
          currentTaskRef.current.cancel()
        } catch (e) {
          // Task might already be complete
        }
      }
    }
  }, [])

  const validateFile = (file) => {
    if (!file) {
      return 'No file selected.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Max size: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`
    }
    // Allow files with no MIME type or known MIME types
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return `File type "${file.type || 'unknown'}" not allowed.`
    }
    return null
  }

  const getFileType = (file) => {
    if (!file) return 'file'
    if (file.type?.startsWith('image/')) return 'image'
    if (file.type === 'application/pdf') return 'pdf'
    if (file.type?.startsWith('video/')) return 'video'
    if (file.type?.startsWith('audio/')) return 'audio'
    return 'file'
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const uploadFile = (file, threadId) => {
    return new Promise((resolve, reject) => {
      setError(null)

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        reject(new Error(validationError))
        return
      }

      setUploading(true)
      setProgress(0)
      currentFileRef.current = file

      // Sanitize file name
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const timestamp = Date.now()
      const path = `uploads/${threadId}/${timestamp}_${sanitizedName}`
      const storageRef = ref(storage, path)
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'application/octet-stream',
      })

      currentTaskRef.current = task

      task.on(
        'state_changed',
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
          setProgress(pct)
        },
        (err) => {
          currentTaskRef.current = null
          currentFileRef.current = null
          setUploading(false)
          setProgress(0)

          // Better error messages
          let errorMsg = 'Upload failed.'
          if (err.code === 'storage/canceled') {
            errorMsg = 'Upload cancelled.'
          } else if (err.code === 'storage/unauthorized') {
            errorMsg = 'You do not have permission to upload files.'
          } else if (err.code === 'storage/quota-exceeded') {
            errorMsg = 'Storage quota exceeded.'
          } else if (err.code === 'storage/retry-limit-exceeded') {
            errorMsg = 'Network error. Please try again.'
          } else if (err.message) {
            errorMsg = `Upload failed: ${err.message}`
          }

          setError(errorMsg)
          reject(new Error(errorMsg))
        },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref)
            currentTaskRef.current = null
            currentFileRef.current = null
            setUploading(false)
            setProgress(0)
            resolve({
              url,
              name: file.name,
              size: file.size,
              type: file.type || 'application/octet-stream',
              fileType: getFileType(file),
              extension: file.name.split('.').pop()?.toLowerCase() || '',
              fileLabel: FILE_TYPE_LABELS[file.type] || file.name.split('.').pop()?.toUpperCase() || 'FILE',
            })
          } catch (err) {
            setError('Failed to get download URL')
            setUploading(false)
            setProgress(0)
            reject(err)
          }
        }
      )
    })
  }

  const cancelUpload = () => {
    if (currentTaskRef.current) {
      try {
        currentTaskRef.current.cancel()
      } catch (e) {
        // ignore
      }
    }
  }

  const deleteFile = async (url) => {
    if (!url) return
    try {
      const fileRef = ref(storage, url)
      await deleteObject(fileRef)
    } catch (err) {
      // File might already be deleted or not exist
      console.warn('Failed to delete file:', err)
    }
  }

  return {
    uploadFile,
    cancelUpload,
    deleteFile,
    progress,
    uploading,
    error,
    validateFile,
    formatFileSize,
    getFileType,
    MAX_FILE_SIZE,
  }
}

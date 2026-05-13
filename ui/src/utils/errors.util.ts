import { toast } from 'sonner'

export class DbWorkerError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'DbWorkerError'
  }
}

export class FetchError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'FetchError'
  }
}

export function handleGlosariumServiceError(error: any) {
  let errorMsg = ''
  let errorDesc = ''
  if (error instanceof DbWorkerError) {
    errorMsg = 'Gagal load offline database'
    errorDesc = 'coba untuk restart/ refresh app glosarium'
  }
  else if (error instanceof FetchError) {
    errorMsg = 'Gagal Terhubung ke Server'
    errorDesc = '(online mode) cek jaringan internet anda.'
  }
  else {
    errorMsg = 'Gagal mendapatkan data glosarium'
    errorDesc = 'terjadi kesalahan pada app, coba restart/ refresh app'
  }
  toast.error(errorMsg, { description: errorDesc, duration: 5000 })
  console.error('gagal load glosarium', error)
}

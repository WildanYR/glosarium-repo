export async function apiGetGlosariumVersion(origin?: string): Promise<{version: string}> {
  const url = new URL('/api/glosarium/update/sync-status', origin || window.location.origin)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || 'Failed to get glosarium version')
  }

  const data: { version: string } = await res.json()

  return data
}

export async function apiSafetyPinCheck(pin: string): Promise<{status: string; message: string}> {
  const url = new URL('/api/glosarium/update/check-pin', window.location.origin)

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({pin})
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || 'Failed to check safety pin')
  }

  const data = await res.json()

  return data
}
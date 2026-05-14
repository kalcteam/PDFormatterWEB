interface FetchWithAuthOptions extends RequestInit {
  skipAuthRedirect?: boolean
}

export async function fetchWithAuth(url: string, options?: FetchWithAuthOptions): Promise<Response> {
  const { skipAuthRedirect, ...fetchOptions } = options || {}
  const response = await fetch(url, fetchOptions)

  if (response.status === 401 && typeof window !== "undefined" && !skipAuthRedirect) {
    window.location.href = "/login"
    return new Promise(() => {})
  }

  return response
}

function isLocalOrigin(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  )
}

export function getAppOrigin() {
  if (typeof window === "undefined") return ""

  const configuredAppUrl = import.meta.env.VITE_APP_URL?.trim()

  if (isLocalOrigin(window.location.hostname)) {
    return configuredAppUrl || window.location.origin
  }

  return window.location.origin
}

export function getResetPasswordUrl() {
  const origin = getAppOrigin()
  return origin ? `${origin.replace(/\/$/, "")}/reset-password` : ""
}

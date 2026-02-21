import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppOrigin(request?: { headers: { get(name: string): string | null }; nextUrl?: { origin: string } }): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (request) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`
    }

    const host = request.headers.get('host')
    if (host && !host.includes('localhost')) {
      return `https://${host}`
    }
  }

  if (request?.nextUrl?.origin) {
    return request.nextUrl.origin
  }

  return 'http://localhost:3000'
}

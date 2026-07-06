// apps/web/src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Each auth page handles its own full-screen layout
  return <>{children}</>
}
import { LoginForm } from "@/components/login-form"
import { SmoothInfiniteScroll } from "@/components/smooth-infinite-scroll"

export default function LoginPage() {
  return (
    <div className="bg-white flex min-h-svh flex-col relative">
      <div className="absolute inset-0 w-full flex flex-row items-center overflow-hidden pointer-events-none gap-4">
        <SmoothInfiniteScroll scrollDirection="down" iconSet="set1" className="flex-1" />
        <SmoothInfiniteScroll scrollDirection="up" iconSet="set2" className="flex-1" />
        <SmoothInfiniteScroll scrollDirection="down" iconSet="set3" className="flex-1" />
      </div>

      <div
        className="absolute left-0 right-0 pointer-events-none z-10 top-[15%] bottom-0 bg-linear-to-t from-white to-transparent"
      />

      <div className="relative z-30 flex-1 px-4 flex flex-col items-center justify-center">
        <div className="flex flex-col w-full max-w-sm gap-6">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

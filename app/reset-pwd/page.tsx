import { ResetPwdForm } from "@/components/reset-pwd-form"
import { Spinner } from "@/components/ui/spinner"
import { Suspense } from "react"

export default function ResetPwdPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-row justify-center items-center h-screen">
                <Spinner />
                <p>Loading...</p>
            </div>}>
            <ResetPwdForm />
        </Suspense>)
}

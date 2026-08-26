import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Log in</h1>
        <p className="text-sm text-slate-600">
          New here?{" "}
          <Link href="/signup" className="font-medium text-slate-900 underline">
            Create an account
          </Link>
        </p>
      </div>
      <AuthForm mode="login" />
    </main>
  );
}

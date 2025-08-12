"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUp() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
      <p>Create a PulseLoop Account</p>
      <form
        className="flex flex-col gap-2 w-full"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", "signUp");
          void signIn("password", formData)
            .catch((error: Error) => {
              setError(error.message);
            })
            .then(() => {
              router.push("/");
            });
        }}
      >
        <input
          className="bg-background text-foreground rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
          type="text"
          name="name"
          placeholder="Enter Name"
          required
        />
        <input
          className="bg-background text-foreground rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
          type="email"
          name="email"
          placeholder="Enter Email"
          required
        />
        <input
          className="bg-background text-foreground rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
          type="password"
          name="password"
          placeholder="Enter Password"
          required
        />
        <button
          className="bg-foreground text-background rounded-md"
          type="submit"
        >
          Sign Up
        </button>
        <div className="flex flex-row gap-2">
          <span>Have an account?</span>
          <a
            className="text-foreground underline hover:no-underline cursor-pointer"
            href="/signin"
          >
            Sign In
          </a>
        </div>
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
            <p className="text-foreground font-mono text-xs">
              Error signing up: {error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

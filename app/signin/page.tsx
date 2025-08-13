"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Navbar, Card, Label, TextInput, Checkbox, Button } from 'flowbite-react';
import Link from 'next/link';
import Image from "next/image";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <section className="bg-white dark:bg-gray-900">
      <Navbar fluid rounded>
        <Link href="/" className="flex items-center">
          <Image src="/pulseloop.svg" width={36} height={36} className="mr-3 h-9 w-9" alt="PulseLoop" />
          <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">PulseLoop</span>
        </Link>
      </Navbar>
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <Card className="w-full bg-white rounded-2xl shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Welcome to PulseLoop
            </h1>
            <form 
              className="space-y-4 md:space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                formData.set("flow", "signIn")
                void signIn("password", formData)
                  .catch((error) => {
                    setError(error.message);
                  })
                  .then(() => {
                    router.push("/");
                  });
              }}            
            >
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="email">Email *</Label>
                </div>
                <TextInput id="email" name="email" placeholder="Enter your email" required type="email" />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="password">Password *</Label>
                </div>
                <TextInput id="password" name="password" placeholder="••••••••" required type="password" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="ml-2">Remember me</Label>
                </div>
                <a href="#" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Lost Password?</a>
              </div>
              <Button className="w-full" type="submit">Sign In</Button>
              <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                Don’t have an account? <a href="/signup" className="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign Up</a>
              </p>
              {error && (
                <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
                  <p className="text-foreground font-mono text-xs">
                    Error signing in: {error}
                  </p>
                </div>
              )}
            </form>
          </div>
        </Card>
      </div>
    </section>
  );
}

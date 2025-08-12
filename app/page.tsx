"use client";

import { Button, Navbar, NavbarBrand } from "flowbite-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-white dark:bg-gray-900 h-screen flex flex-col">
      <header className="absolute top-0 w-full z-10 bg-transparent">
        <Navbar fluid rounded className="bg-gray-50 dark:bg-gray-900">
        <NavbarBrand href="/">
        <img src="/pulseloop.svg" className="mr-3 h-9 w-9" alt="PulseLoop" />
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">PulseLoop</span>
      </NavbarBrand>
          <div className="flex md:order-2">
            <Button as={Link} href="/signin">
              Sign in
            </Button>
          </div>
        </Navbar>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-4">
        <img src="/pulseloop.svg" className="mr-3 h-12 w-12" alt="PulseLoop" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          PulseLoop
          <br />
          Real-Time Feedback Engine
        </h1>
        <div className="mt-10">
          <Button as={Link} href="/signin" size="xl">
            Sign In
          </Button>
        </div>
      </main>
    </div>
  );
}

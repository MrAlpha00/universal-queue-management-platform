"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/env";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [show, setShow] = React.useState(false);
  const ready = hasSupabaseConfig();

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: Values) {
    if (!ready) {
      toast.error("Supabase is not configured. Add your project credentials to .env.local.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    router.push(params.get("next") || "/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Log in to TokenFlow"
      description="Your appointments, tokens and organization workspace are waiting."
      footer={
        <p>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-violet-300 hover:text-violet-200">
            Create an account
          </Link>
        </p>
      }
    >
      {params.get("setup") && (
        <div className="mb-5 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
          Supabase credentials are not configured yet. Follow <code>docs/setup.md</code> to connect
          your project, then reload this page.
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Email address" htmlFor="email" error={form.formState.errors.email?.message}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="pl-10"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
          </div>
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="px-10"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle transition hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-xs font-medium text-cyan-300 hover:text-cyan-200">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}

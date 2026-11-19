"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Building2, Check, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/env";
import { cn } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().min(2, "Please enter your name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  accountType: z.enum(["customer", "organization"]),
});
type Values = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [ready] = React.useState(() => hasSupabaseConfig());

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "", accountType: "customer" },
  });
  const accountType = useWatch({ control: form.control, name: "accountType" });

  async function onSubmit(values: Values) {
    if (!ready) {
      toast.error("Supabase is not configured. Add your project credentials to .env.local.");
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          account_type: values.accountType,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${
          values.accountType === "organization" ? "/onboarding/organization" : "/dashboard"
        }`,
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Your account is ready");
      router.push(values.accountType === "organization" ? "/onboarding/organization" : "/dashboard");
      router.refresh();
      return;
    }
    toast.success("Check your inbox to verify your email", {
      description: "We'll take you to the next step as soon as you're verified.",
    });
  }

  return (
    <AuthCard
      eyebrow="Get started"
      title="Create your account"
      description="Set up an account in under a minute. No credit card, no hardware."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-violet-300 hover:text-violet-200">
            Log in
          </Link>
        </p>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "customer", label: "Customer", icon: UserRound, hint: "Book appointments" },
            { value: "organization", label: "Organization", icon: Building2, hint: "Run operations" },
          ].map((option) => {
            const Icon = option.icon;
            const active = accountType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => form.setValue("accountType", option.value as Values["accountType"])}
                className={cn(
                  "relative rounded-xl border p-3.5 text-left transition-all",
                  active
                    ? "border-violet-400/50 bg-violet-500/12 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]"
                    : "border-white/10 bg-white/[0.025] hover:border-white/20",
                )}
              >
                <Icon className={cn("size-4", active ? "text-violet-300" : "text-subtle")} />
                <p className="mt-2 text-xs font-bold text-foreground">{option.label}</p>
                <p className="mt-0.5 text-[10px] text-subtle">{option.hint}</p>
                {active && <Check className="absolute right-3 top-3 size-3 text-violet-300" />}
              </button>
            );
          })}
        </div>

        <Field label="Full name" htmlFor="fullName" error={form.formState.errors.fullName?.message}>
          <Input id="fullName" autoComplete="name" placeholder="Alex Morgan" {...form.register("fullName")} />
        </Field>
        <Field label="Email address" htmlFor="email" error={form.formState.errors.email?.message}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" className="pl-10" {...form.register("email")} />
          </div>
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" className="pl-10" {...form.register("password")} />
          </div>
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
          Create account
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-subtle">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </form>
    </AuthCard>
  );
}

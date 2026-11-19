"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: Values) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Password reset link sent");
  }

  return (
    <AuthCard
      eyebrow="Account recovery"
      title="Reset your password"
      description="We'll send a secure reset link to your email address."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-violet-300 hover:text-violet-200">
          <ArrowLeft className="size-3.5" /> Back to login
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-teal-400/25 bg-teal-500/10 p-5 text-sm leading-relaxed text-emerald-100">
          Check your inbox. The reset link expires shortly — if you don&apos;t see it, check your
          spam folder and try again.
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Field label="Email address" htmlFor="email" error={form.formState.errors.email?.message}>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input id="email" type="email" placeholder="you@example.com" className="pl-10" {...form.register("email")} />
            </div>
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

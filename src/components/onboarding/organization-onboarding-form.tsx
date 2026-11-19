"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, Building2, Globe2, Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input, SelectNative, Textarea } from "@/components/ui/input";
import { createOrganizationAction } from "@/app/(customer)/actions";
import { slugify } from "@/lib/utils";

const timezones = [
  "UTC", "Africa/Cairo", "Africa/Lagos", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/New_York", "America/Sao_Paulo", "Asia/Dubai",
  "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney",
  "Europe/Berlin", "Europe/London", "Europe/Paris",
];

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter an organization name")
    .max(120, "Keep the name under 120 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Enter a public URL slug")
    .max(60, "Keep the slug under 60 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens"),
  description: z.string().trim().max(600, "Keep the description under 600 characters").optional(),
  timezone: z.string().min(1),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;

export function OrganizationOnboardingForm({
  defaultEmail,
  defaultTimezone,
}: {
  defaultEmail: string;
  defaultTimezone: string;
}) {
  const router = useRouter();
  const [slugEdited, setSlugEdited] = React.useState(false);
  const [error, setError] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      timezone: timezones.includes(defaultTimezone) ? defaultTimezone : "UTC",
      email: defaultEmail,
      phone: "",
      address: "",
    },
  });

  const name = useWatch({ control: form.control, name: "name" });
  const slug = useWatch({ control: form.control, name: "slug" });

  React.useEffect(() => {
    if (!slugEdited) {
      form.setValue("slug", slugify(name ?? ""), { shouldValidate: false });
    }
  }, [name, slugEdited, form]);

  const slugField = form.register("slug");

  function onSubmit(values: Values) {
    setError("");
    const payload = {
      name: values.name.trim(),
      slug: slugify(values.slug),
      timezone: values.timezone,
      description: values.description?.trim() || undefined,
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      address: values.address?.trim() || undefined,
    };

    startTransition(async () => {
      try {
        const result = await createOrganizationAction(payload);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success(
          result.status === "APPROVED" ? "Organization created" : "Organization submitted for approval",
          {
            description:
              result.status === "APPROVED"
                ? "You can start configuring services right away."
                : "You can prepare services and schedules while the platform team reviews it.",
          },
        );
        router.push(`/manage/${result.slug}/overview`);
        router.refresh();
      } catch {
        setError("We could not create the organization. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Building2 className="size-4 text-violet-300" /> Organization details
        </div>
        <p className="mt-1 text-xs text-muted">
          This information appears on your public organization page.
        </p>

        {error && (
          <p className="mt-5 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            label="Organization name"
            required
            htmlFor="org-name"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="org-name"
              autoComplete="organization"
              placeholder="Northside Dental"
              {...form.register("name")}
            />
          </Field>

          <Field
            label="Public URL slug"
            required
            htmlFor="org-slug"
            error={form.formState.errors.slug?.message}
            hint="Lowercase letters, numbers and hyphens."
          >
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                id="org-slug"
                className="pl-10"
                placeholder="northside-dental"
                {...slugField}
                onChange={(event) => {
                  setSlugEdited(true);
                  slugField.onChange(event);
                }}
              />
            </div>
          </Field>

          <Field
            label="Description"
            className="sm:col-span-2"
            htmlFor="org-description"
            error={form.formState.errors.description?.message}
            hint="A short introduction customers see before booking."
          >
            <Textarea
              id="org-description"
              placeholder="What you offer and who you serve."
              {...form.register("description")}
            />
          </Field>

          <Field
            label="Timezone"
            required
            htmlFor="org-timezone"
            hint="Used for booking windows, reminders and reports."
          >
            <div className="relative">
              <Globe2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <SelectNative id="org-timezone" className="pl-10" {...form.register("timezone")}>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </SelectNative>
            </div>
          </Field>

          <Field
            label="Support email"
            htmlFor="org-email"
            error={form.formState.errors.email?.message}
            hint="Customers use this to reach you about bookings."
          >
            <Input
              id="org-email"
              type="email"
              autoComplete="email"
              placeholder="hello@example.com"
              {...form.register("email")}
            />
          </Field>

          <Field label="Phone" htmlFor="org-phone" error={form.formState.errors.phone?.message}>
            <Input
              id="org-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1 555 0100"
              {...form.register("phone")}
            />
          </Field>

          <Field label="Address" htmlFor="org-address" error={form.formState.errors.address?.message}>
            <Input
              id="org-address"
              autoComplete="street-address"
              placeholder="Street, city, country"
              {...form.register("address")}
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
          <p className="text-[11px] text-subtle">
            Public page preview: <span className="font-mono text-muted">/organizations/{slug || "your-organization"}</span>
          </p>
          <Button type="submit" size="lg" loading={pending} disabled={pending}>
            Create organization <ArrowRight className="size-4" />
          </Button>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="size-4 text-cyan-300" /> What happens next
          </div>
          <ol className="mt-4 space-y-4">
            {[
              {
                title: "Create the workspace",
                detail: "You become the owner, and a main branch with weekday hours is created automatically.",
              },
              {
                title: "Prepare your services",
                detail: "Add services, booking questions and schedule rules while approval is pending.",
              },
              {
                title: "Start taking bookings",
                detail: "Once approved, your organization appears in discovery and customers can book.",
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-violet-400/25 bg-violet-500/10 text-[10px] font-bold text-violet-200">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold text-foreground">Approval and access</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            New organizations are reviewed by the platform team unless auto-approval is enabled.
            Your workspace is available immediately; only public booking is paused until approval.
          </p>
        </Card>
      </div>
    </form>
  );
}

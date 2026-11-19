"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock3, ListPlus, Pencil, Plus, Power, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input, SelectNative, Textarea } from "@/components/ui/input";
import {
  addServiceField,
  deleteServiceField,
  saveService,
  toggleService,
} from "@/app/manage/[orgSlug]/actions";
import type { Branch, Service, ServiceField } from "@/types/domain";

const colors = ["violet", "cyan", "teal", "amber", "rose", "indigo", "sky", "emerald"];
const fieldTypes = ["TEXT", "EMAIL", "PHONE", "NUMBER", "TEXTAREA", "SELECT", "RADIO", "CHECKBOX", "DATE"];

type ServiceForm = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  branchId: string;
  durationMinutes: number;
  bufferMinutes: number;
  capacity: number;
  cancellationHours: number;
  allowCancellation: boolean;
  color: string;
  isActive: boolean;
};

const blank: ServiceForm = {
  id: null,
  name: "",
  slug: "",
  description: "",
  branchId: "",
  durationMinutes: 15,
  bufferMinutes: 0,
  capacity: 1,
  cancellationHours: 0,
  allowCancellation: true,
  color: "violet",
  isActive: true,
};

export function ServicesManager({
  orgSlug,
  services,
  fields,
  branches,
}: {
  orgSlug: string;
  services: Service[];
  fields: ServiceField[];
  branches: Branch[];
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<ServiceForm | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");
  const [fieldService, setFieldService] = React.useState<Service | null>(null);

  function openCreate() {
    setError("");
    setForm({ ...blank, branchId: branches[0]?.id ?? "" });
  }

  function openEdit(service: Service) {
    setError("");
    setForm({
      id: service.id,
      name: service.name,
      slug: service.slug,
      description: service.description ?? "",
      branchId: service.branch_id ?? "",
      durationMinutes: service.duration_minutes,
      bufferMinutes: service.buffer_minutes,
      capacity: service.capacity,
      cancellationHours: service.cancellation_hours,
      allowCancellation: service.allow_cancellation,
      color: service.color,
      isActive: service.is_active,
    });
  }

  function submit() {
    if (!form) return;
    setError("");
    startTransition(async () => {
      try {
        await saveService(orgSlug, form.id, {
          name: form.name,
          slug: form.slug,
          description: form.description,
          branchId: form.branchId,
          durationMinutes: form.durationMinutes,
          bufferMinutes: form.bufferMinutes,
          capacity: form.capacity,
          cancellationHours: form.cancellationHours,
          allowCancellation: form.allowCancellation,
          color: form.color,
          isActive: form.isActive,
        });
        setForm(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save service");
      }
    });
  }

  function toggle(service: Service) {
    startTransition(async () => {
      try {
        await toggleService(orgSlug, service.id, !service.is_active);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to update service");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{services.length} service{services.length === 1 ? "" : "s"} configured</p>
        <Button variant="cyan" size="sm" onClick={openCreate}><Plus className="size-3.5" /> New service</Button>
      </div>

      {error && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const serviceFields = fields.filter((field) => field.service_id === service.id);
          return (
            <Card key={service.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${service.color === "cyan" ? "bg-cyan-400" : service.color === "teal" || service.color === "emerald" ? "bg-emerald-400" : service.color === "amber" ? "bg-amber-400" : service.color === "rose" ? "bg-rose-400" : "bg-violet-400"}`} />
                    <h3 className="truncate text-sm font-bold">{service.name}</h3>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted">{service.description || "No description"}</p>
                </div>
                <Badge tone={service.is_active ? "teal" : "neutral"}>{service.is_active ? "Active" : "Paused"}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-subtle">
                <span className="flex items-center gap-1"><Clock3 className="size-3" /> {service.duration_minutes} min</span>
                <span className="flex items-center gap-1"><Users className="size-3" /> {service.capacity}/slot</span>
                <span className="flex items-center gap-1"><ListPlus className="size-3" /> {serviceFields.length} fields</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/[0.07] pt-3">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => openEdit(service)}><Pencil className="size-3" /> Edit</Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setFieldService(service)}><ListPlus className="size-3" /> Fields</Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => toggle(service)}><Power className="size-3" /> {service.is_active ? "Pause" : "Activate"}</Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent size="wide">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit service" : "New service"}</DialogTitle>
            <DialogDescription>Configure duration, capacity and booking rules.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            {form && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required htmlFor="service-name">
                  <Input id="service-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Slug" hint="Leave blank to generate from the name." htmlFor="service-slug">
                  <Input id="service-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="general-consultation" />
                </Field>
                <Field label="Branch" htmlFor="service-branch">
                  <SelectNative id="service-branch" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                    <option value="">All branches</option>
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                  </SelectNative>
                </Field>
                <Field label="Color" htmlFor="service-color">
                  <SelectNative id="service-color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                    {colors.map((color) => <option key={color} value={color}>{color}</option>)}
                  </SelectNative>
                </Field>
                <Field label="Description" className="sm:col-span-2" htmlFor="service-description">
                  <Textarea id="service-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
                <Field label="Duration (minutes)" htmlFor="service-duration">
                  <Input id="service-duration" type="number" min={1} max={480} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
                </Field>
                <Field label="Buffer (minutes)" htmlFor="service-buffer">
                  <Input id="service-buffer" type="number" min={0} max={240} value={form.bufferMinutes} onChange={(e) => setForm({ ...form, bufferMinutes: Number(e.target.value) })} />
                </Field>
                <Field label="Capacity per slot" htmlFor="service-capacity">
                  <Input id="service-capacity" type="number" min={1} max={1000} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                </Field>
                <Field label="Cancellation cutoff (hours)" htmlFor="service-cancel">
                  <Input id="service-cancel" type="number" min={0} max={720} value={form.cancellationHours} onChange={(e) => setForm({ ...form, cancellationHours: Number(e.target.value) })} />
                </Field>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" checked={form.allowCancellation} onChange={(e) => setForm({ ...form, allowCancellation: e.target.checked })} className="size-4 accent-violet-500" />
                  Allow customer cancellation
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 accent-violet-500" />
                  Service is active
                </label>
              </div>
            )}
            {error && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            <Button variant="cyan" loading={pending} disabled={pending || !form?.name.trim()} onClick={submit}>Save service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FieldsDialog
        orgSlug={orgSlug}
        service={fieldService}
        fields={fields.filter((field) => field.service_id === fieldService?.id)}
        onClose={() => setFieldService(null)}
      />
    </div>
  );
}

function FieldsDialog({
  orgSlug,
  service,
  fields,
  onClose,
}: {
  orgSlug: string;
  service: Service | null;
  fields: ServiceField[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");
  const [name, setName] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [fieldType, setFieldType] = React.useState("TEXT");
  const [placeholder, setPlaceholder] = React.useState("");
  const [options, setOptions] = React.useState("");
  const [required, setRequired] = React.useState(false);

  function add() {
    if (!service) return;
    setError("");
    startTransition(async () => {
      try {
        await addServiceField(orgSlug, {
          serviceId: service.id,
          name,
          label,
          fieldType: fieldType as never,
          placeholder,
          helpText: "",
          isRequired: required,
          options,
          displayOrder: fields.length,
        });
        setName("");
        setLabel("");
        setPlaceholder("");
        setOptions("");
        setRequired(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to add field");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      try {
        await deleteServiceField(orgSlug, id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to delete field");
      }
    });
  }

  return (
    <Dialog open={Boolean(service)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="wide">
        <DialogHeader>
          <DialogTitle>Booking fields · {service?.name}</DialogTitle>
          <DialogDescription>Collect service-specific information when customers book.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-2">
            {fields.length ? fields.map((field) => (
              <div key={field.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{field.label} {field.is_required && <span className="text-rose-300">*</span>}</p>
                  <p className="text-[11px] text-subtle">{field.field_type} · key: {field.name}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(field.id)} aria-label="Delete field"><Trash2 className="size-3.5 text-rose-300" /></Button>
              </div>
            )) : <p className="text-xs text-subtle">No custom fields yet.</p>}
          </div>

          <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-subtle">Add a field</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Label" htmlFor="field-label"><Input id="field-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Vehicle registration" /></Field>
              <Field label="Key" htmlFor="field-name"><Input id="field-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="vehicle_reg" /></Field>
              <Field label="Type" htmlFor="field-type">
                <SelectNative id="field-type" value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
                  {fieldTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </SelectNative>
              </Field>
              <Field label="Placeholder" htmlFor="field-placeholder"><Input id="field-placeholder" value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} /></Field>
              {(fieldType === "SELECT" || fieldType === "RADIO") && (
                <Field label="Options (one per line)" className="sm:col-span-2" htmlFor="field-options">
                  <Textarea id="field-options" value={options} onChange={(e) => setOptions(e.target.value)} placeholder={"Option A\nOption B"} />
                </Field>
              )}
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="size-4 accent-violet-500" /> Required field
              </label>
            </div>
            <Button variant="secondary" size="sm" className="mt-3" loading={pending} disabled={pending || !name || !label} onClick={add}><Plus className="size-3.5" /> Add field</Button>
            {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
          </div>
        </DialogBody>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { ArrowLeft, CheckCircle, CalendarDays } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import { useI18n } from "@/hooks/use-i18n";
import { PageTransition } from "@/components/page-transition";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { submitTourRequest } from "@/lib/tour/actions";

type FormState = "idle" | "submitting" | "success" | "error";

export default function TourPage() {
  const t = useI18n();
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    time: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("tour.errors.nameRequired");
    }
    if (!formData.email.trim()) {
      newErrors.email = t("tour.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("tour.errors.emailInvalid");
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t("tour.errors.phoneRequired");
    }
    if (!selectedDate) {
      newErrors.date = t("tour.errors.dateRequired");
    }
    if (!formData.time) {
      newErrors.time = t("tour.errors.timeRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormState("submitting");
    setErrorMessage("");

    const result = await submitTourRequest({
      ...formData,
      date: selectedDate!.toISOString(),
    });

    if ("error" in result) {
      setFormState("error");
      setErrorMessage(result.error);
    } else {
      setFormState("success");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  if (formState === "success") {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <PageTransition>
          <main className="pt-24 pb-32">
            <div className="container mx-auto px-6 max-w-lg">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-foreground/90 mb-4">
                  {t("tour.success.title")}
                </h1>
                <p className="text-foreground/60 mb-4">
                  {t("tour.success.message")}
                </p>
                <p className="text-sm text-foreground/40 mb-8">
                  {t("tour.success.note")}
                </p>
                <Button asChild variant="outline">
                  <Link href="/concept">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    {t("tour.success.backToTop")}
                  </Link>
                </Button>
              </m.div>
            </div>
          </main>
        </PageTransition>
        <Footer variant="minimal" />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PageTransition>
        <main className="pt-24 pb-32">
          <div className="container mx-auto px-6 max-w-lg">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Link
                href="/concept"
                className="inline-flex items-center text-sm text-foreground/50 hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                {t("common.back")}
              </Link>

              <h1 className="text-3xl font-bold text-foreground/90 mb-2">
                {t("tour.title")}
              </h1>
              <p className="text-foreground/60">{t("tour.description")}</p>
            </m.div>

            <m.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="name">{t("tour.form.name")}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("tour.form.namePlaceholder")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("tour.form.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t("tour.form.emailPlaceholder")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("tour.form.phone")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t("tour.form.phonePlaceholder")}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("tour.form.date")}</Label>
                <div
                  className={`border rounded-lg p-4 ${errors.date ? "border-red-500" : "border-border"}`}
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date: Date | undefined) => {
                      setSelectedDate(date);
                      if (errors.date) {
                        setErrors((prev) => ({ ...prev, date: "" }));
                      }
                    }}
                    disabled={(date: Date) => {
                      const day = date.getDay();
                      return (
                        date < minDate ||
                        date > maxDate ||
                        day === 0 ||
                        day === 6
                      );
                    }}
                    className="mx-auto"
                  />
                </div>
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">{t("tour.form.time")}</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value: string) => {
                    setFormData((prev) => ({ ...prev, time: value }));
                    if (errors.time) {
                      setErrors((prev) => ({ ...prev, time: "" }));
                    }
                  }}
                >
                  <SelectTrigger
                    className={errors.time ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={t("tour.form.timePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">
                      {t("tour.form.timeOptions.morning")}
                    </SelectItem>
                    <SelectItem value="afternoon">
                      {t("tour.form.timeOptions.afternoon")}
                    </SelectItem>
                    <SelectItem value="evening">
                      {t("tour.form.timeOptions.evening")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.time && (
                  <p className="text-sm text-red-500">{errors.time}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t("tour.form.notes")}</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder={t("tour.form.notesPlaceholder")}
                  rows={3}
                />
              </div>

              {formState === "error" && errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-white"
                disabled={formState === "submitting"}
              >
                {formState === "submitting" ? (
                  t("tour.form.submitting")
                ) : (
                  <>
                    <CalendarDays className="mr-2 w-4 h-4" />
                    {t("tour.form.submit")}
                  </>
                )}
              </Button>
            </m.form>
          </div>
        </main>
      </PageTransition>
      <Footer variant="minimal" />
      <MobileNav />
    </div>
  );
}

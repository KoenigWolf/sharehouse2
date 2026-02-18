"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { ArrowLeft, CheckCircle, Send } from "lucide-react";
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
import { submitContactForm } from "@/lib/contact/actions";

type FormState = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const t = useI18n();
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("contact.errors.nameRequired");
    }
    if (!formData.email.trim()) {
      newErrors.email = t("contact.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("contact.errors.emailInvalid");
    }
    if (!formData.subject) {
      newErrors.subject = t("contact.errors.subjectRequired");
    }
    if (!formData.message.trim()) {
      newErrors.message = t("contact.errors.messageRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormState("submitting");
    setErrorMessage("");

    const result = await submitContactForm(formData);

    if ("error" in result) {
      setFormState("error");
      const errorKey = result.error === "RATE_LIMITED"
        ? "contact.errors.rateLimited"
        : "contact.errors.submitFailed";
      setErrorMessage(t(errorKey));
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
                  {t("contact.success.title")}
                </h1>
                <p className="text-foreground/60 mb-8">
                  {t("contact.success.message")}
                </p>
                <Button asChild variant="outline">
                  <Link href="/concept">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    {t("contact.success.backToTop")}
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
                {t("contact.title")}
              </h1>
              <p className="text-foreground/60">{t("contact.description")}</p>
            </m.div>

            <m.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="name">{t("contact.form.name")}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("contact.form.namePlaceholder")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("contact.form.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t("contact.form.emailPlaceholder")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("contact.form.phone")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t("contact.form.phonePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{t("contact.form.subject")}</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value: string) => {
                    setFormData((prev) => ({ ...prev, subject: value }));
                    if (errors.subject) {
                      setErrors((prev) => ({ ...prev, subject: "" }));
                    }
                  }}
                >
                  <SelectTrigger
                    className={errors.subject ? "border-red-500" : ""}
                  >
                    <SelectValue
                      placeholder={t("contact.form.subjectPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inquiry">
                      {t("contact.form.subjectOptions.inquiry")}
                    </SelectItem>
                    <SelectItem value="tour">
                      {t("contact.form.subjectOptions.tour")}
                    </SelectItem>
                    <SelectItem value="other">
                      {t("contact.form.subjectOptions.other")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.subject && (
                  <p className="text-sm text-red-500">{errors.subject}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("contact.form.message")}</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={t("contact.form.messagePlaceholder")}
                  rows={5}
                  className={errors.message ? "border-red-500" : ""}
                />
                {errors.message && (
                  <p className="text-sm text-red-500">{errors.message}</p>
                )}
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
                  t("contact.form.submitting")
                ) : (
                  <>
                    <Send className="mr-2 w-4 h-4" />
                    {t("contact.form.submit")}
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

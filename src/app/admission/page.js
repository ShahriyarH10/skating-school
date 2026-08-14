"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icons";

const MAX_PHOTO_BYTES = 200 * 1024; // matches the school's own stated limit
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const MONTHS = [
  ["01", "January"], ["02", "February"], ["03", "March"], ["04", "April"],
  ["05", "May"], ["06", "June"], ["07", "July"], ["08", "August"],
  ["09", "September"], ["10", "October"], ["11", "November"], ["12", "December"],
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 68 }, (_, i) => String(CURRENT_YEAR - 3 - i));

// Resize + re-encode an uploaded photo client-side until it's under the
// school's 200KB limit. The legacy form just printed that limit as text
// with no enforcement — this actually enforces it.
function compressImage(file, maxBytes) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image"));
      img.onload = () => {
        let [w, h] = [img.width, img.height];
        const maxDim = 900;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale); h = Math.round(h * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        let quality = 0.9;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        const sizeOf = (du) => Math.round((du.length - du.indexOf(",") - 1) * 0.75);
        while (sizeOf(dataUrl) > maxBytes && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve({ dataUrl, bytes: sizeOf(dataUrl) });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const initialForm = {
  name: "", email: "", password: "", confirmPassword: "", mobile: "", clubId: "", program: "Beginner",
  presentAddress: "", sameAsPresent: false, permanentAddress: "",
  fatherName: "", fatherNid: "", fatherOccupation: "", fatherOccupationType: "", fatherMobile: "",
  motherName: "", motherNid: "", motherOccupation: "", motherOccupationType: "", motherMobile: "",
  dobDay: "", dobMonth: "", dobYear: "", birthReg: "", bloodGroup: "", presentSchool: "",
  religion: "ISLAM", gender: "", shift: "", agree: false,
};

// Single source of truth for "is this field filled in correctly", shared by
// the Continue-button gate, the inline red error text, and the final Submit
// gate. Every rule here mirrors admissionSchema on the server (src/lib/validation.js)
// on purpose — a field the frontend treats as optional but the backend treats
// as required is exactly how the old form could look complete and still fail
// on submit with a generic "check the form" error.
function fieldError(key, form, photo) {
  switch (key) {
    case "photo": return photo ? "" : "Upload the applicant's photo";
    case "name": return form.name.trim().length >= 2 ? "" : "Enter the student's full name";
    case "clubId": return form.clubId ? "" : "Select a branch";
    case "mobile": return form.mobile.trim().length >= 6 ? "" : "Enter a valid mobile number";
    case "email": return /\S+@\S+\.\S+/.test(form.email) ? "" : "Enter a valid email address";
    case "presentAddress": return form.presentAddress.trim().length >= 5 ? "" : "Enter the present address";
    case "permanentAddress": return (form.sameAsPresent || form.permanentAddress.trim().length >= 5) ? "" : "Enter the permanent address";
    case "fatherName": return form.fatherName.trim().length >= 2 ? "" : "Enter father's name";
    case "fatherNid": return form.fatherNid.trim().length >= 2 ? "" : "Enter father's NID number";
    case "fatherOccupation": return form.fatherOccupation.trim().length >= 2 ? "" : "Enter father's occupation";
    case "fatherOccupationType": return form.fatherOccupationType ? "" : "Select an occupation type";
    case "fatherMobile": return form.fatherMobile.trim().length >= 6 ? "" : "Enter father's mobile number";
    case "motherName": return form.motherName.trim().length >= 2 ? "" : "Enter mother's name";
    case "motherNid": return form.motherNid.trim().length >= 2 ? "" : "Enter mother's NID number";
    case "motherOccupation": return form.motherOccupation.trim().length >= 2 ? "" : "Enter mother's occupation";
    case "motherOccupationType": return form.motherOccupationType ? "" : "Select an occupation type";
    case "motherMobile": return form.motherMobile.trim().length >= 6 ? "" : "Enter mother's mobile number";
    case "dob": return (form.dobDay && form.dobMonth && form.dobYear) ? "" : "Select the full date of birth";
    case "birthReg": return form.birthReg.trim().length >= 2 ? "" : "Enter the birth registration number";
    case "bloodGroup": return form.bloodGroup.trim().length >= 1 ? "" : "Enter a blood group";
    case "presentSchool": return form.presentSchool.trim().length >= 2 ? "" : "Enter the present school";
    case "gender": return form.gender ? "" : "Select a gender";
    case "shift": return form.shift ? "" : "Select a shift";
    case "password": return form.password.length >= 8 ? "" : "Use at least 8 characters";
    case "confirmPassword":
      if (!form.confirmPassword) return "Re-enter the password";
      return form.confirmPassword === form.password ? "" : "Passwords don't match";
    case "agree": return form.agree ? "" : "Please confirm before submitting";
    default: return "";
  }
}

const STEPS = [
  { name: "Basics", icon: Icon.User, fields: ["photo", "name", "clubId", "mobile", "email"] },
  { name: "Address", icon: Icon.MapPin, fields: ["presentAddress", "permanentAddress"] },
  { name: "Guardians", icon: Icon.Users, fields: ["fatherName", "fatherNid", "fatherOccupation", "fatherOccupationType", "fatherMobile", "motherName", "motherNid", "motherOccupation", "motherOccupationType", "motherMobile"] },
  { name: "Details", icon: Icon.Clipboard, fields: ["dob", "birthReg", "bloodGroup", "presentSchool", "gender", "shift"] },
  { name: "Account", icon: Icon.Lock, fields: ["password", "confirmPassword", "agree"] },
];

const inputCls = (hasErr) =>
  `w-full px-4 py-3 border rounded-xl text-[15px] bg-white text-slate-800 outline-none transition-all focus:ring-4 ${
    hasErr ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-teal focus:ring-teal/10"
  }`;
const labelCls = "text-[13px] font-semibold text-slate-700 block mb-1.5";
const sectionTitleCls = "text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3.5";

// Consistent label + input + inline-error wrapper, used for every field below
// so a required field can never again be visually indistinguishable from an
// optional one. Defined at module scope (not inside AdmissionPage) on purpose:
// a component declared inside another component's body gets a brand-new
// identity on every render, so React unmounts and remounts it — which is
// exactly what was making every input lose focus after one keystroke.
function Field({ label, required, hint, error, showError, children }) {
  return (
    <div>
      <label className={labelCls}>
        {label}{required && <span className="text-amber ml-0.5">*</span>}
      </label>
      {children}
      {showError ? (
        <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
          <Icon.AlertTriangle width={11} height={11} className="flex-shrink-0" /> {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-slate-400 mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

export default function AdmissionPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState(null); // { dataUrl, bytes }
  const [photoError, setPhotoError] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState({});

  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const touch = (k) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  const touchMany = (keys) => setTouched((t) => ({ ...t, ...Object.fromEntries(keys.map((k) => [k, true])) }));
  const err = (k) => fieldError(k, form, photo);
  const show = (k) => touched[k] && err(k);

  useEffect(() => {
    fetch("/api/clubs").then((r) => r.json()).then(setClubs).catch(() => {});
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const [dragOver, setDragOver] = useState(false);

  const processPhotoFile = async (file) => {
    if (!file) return;
    setPhotoError("");
    if (!file.type.startsWith("image/")) { setPhotoError("Please upload an image file"); return; }
    setCompressing(true);
    try {
      const result = await compressImage(file, MAX_PHOTO_BYTES);
      setPhoto(result);
      touch("photo");
    } catch (photoErr) {
      setPhotoError(photoErr.message);
    } finally {
      setCompressing(false);
    }
  };
  const handlePhoto = (e) => processPhotoFile(e.target.files?.[0]);
  const handlePhotoDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processPhotoFile(e.dataTransfer.files?.[0]);
  };

  const stepHasErrors = (i) => STEPS[i].fields.some((k) => err(k));
  const formValid = STEPS.every((_, i) => !stepHasErrors(i));

  const goNext = () => {
    if (stepHasErrors(step)) { touchMany(STEPS[step].fields); return; }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const submit = async (e) => {
    e.preventDefault();
    if (!formValid) {
      // Shouldn't be reachable (Submit is disabled until formValid), but if
      // it ever is, jump to the first step that still has a problem instead
      // of firing a request the backend will reject.
      const badStep = STEPS.findIndex((_, i) => stepHasErrors(i));
      touchMany(STEPS[badStep].fields);
      setStep(badStep);
      return;
    }
    setError(""); setSubmitting(true);
    try {
      const payload = {
        name: form.name, email: form.email, password: form.password, mobile: form.mobile,
        clubId: form.clubId || null, program: form.program,
        presentAddress: form.presentAddress,
        sameAsPresent: form.sameAsPresent,
        // The server validates permanentAddress as its own required field
        // before it ever looks at sameAsPresent — so when the box is
        // checked, send the present address as the permanent one instead
        // of an empty string, or every "same as present" submission gets
        // rejected with a generic validation error.
        permanentAddress: form.sameAsPresent ? form.presentAddress : form.permanentAddress,
        fatherName: form.fatherName, fatherNid: form.fatherNid, fatherOccupation: form.fatherOccupation,
        fatherOccupationType: form.fatherOccupationType, fatherMobile: form.fatherMobile,
        motherName: form.motherName, motherNid: form.motherNid, motherOccupation: form.motherOccupation,
        motherOccupationType: form.motherOccupationType, motherMobile: form.motherMobile,
        dob: { day: form.dobDay, month: form.dobMonth, year: form.dobYear },
        birthReg: form.birthReg, bloodGroup: form.bloodGroup, presentSchool: form.presentSchool,
        religion: form.religion, gender: form.gender, shift: form.shift,
        photo: photo?.dataUrl || "", agree: form.agree,
      };
      const res = await fetch("/api/admission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); setSubmitting(false); return; }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] hidden sm:block" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #0891B2 1px, transparent 0)", backgroundSize: "36px 36px" }} />
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(8,145,178,0.16)_0%,transparent_70%)] rounded-full hidden sm:block" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(245,158,11,0.10)_0%,transparent_70%)] rounded-full hidden sm:block" />

      <div className="relative z-10 sm:max-w-3xl sm:mx-auto sm:px-5 sm:py-12">
        <div className="hidden sm:block px-5 sm:px-0">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors">
            <Icon.ArrowLeft width={15} height={15} /> Back to home
          </Link>
        </div>

        <div className="bg-white sm:rounded-2xl sm:shadow-popover min-h-screen sm:min-h-0 flex flex-col animate-scaleIn">
          {/* Progress header — sticky on mobile so it reads like a native app's step bar */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 sm:border-0 sm:static sm:bg-transparent px-5 sm:px-10 pt-4 sm:pt-10 pb-3 sm:pb-0">
            <div className="flex items-center gap-3 mb-3">
              <Link href="/" className="sm:hidden -ml-1 p-1.5 text-slate-400 active:text-slate-600">
                <Icon.ArrowLeft width={18} height={18} />
              </Link>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex-1">
                Step {step + 1} of {STEPS.length} · {STEPS[step].name}
              </span>
            </div>
            <div className="flex items-center">
              {STEPS.map((s, i) => (
                <div key={s.name} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      i < step
                        ? "bg-teal text-white"
                        : i === step
                        ? "bg-gradient-to-br from-teal to-teal-light text-white shadow-glow-teal scale-110"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {i < step ? <Icon.Check width={13} height={13} strokeWidth={3} /> : <s.icon width={13} height={13} />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-[2px] mx-1 sm:mx-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div className="h-full bg-teal transition-all duration-500" style={{ width: i < step ? "100%" : "0%" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 sm:px-10 pt-5 sm:pt-8">
            {step === 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-xl flex-shrink-0">⛸</div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Student Admission Form</h1>
                  <p className="text-xs text-slate-500 mt-0.5">A few quick steps — you'll get instant access to your student dashboard.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-slideUp">
                <Icon.AlertTriangle width={16} height={16} className="flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="flex-1 flex flex-col">
            <div key={step} className="animate-slideUp flex-1 px-5 sm:px-10 pb-28 sm:pb-0 space-y-7">

              {step === 0 && (
                <>
                  <div>
                    <h2 className={sectionTitleCls}>Applicant's photo</h2>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handlePhotoDrop}
                      className={`relative flex items-center gap-4 sm:gap-5 rounded-2xl border-2 border-dashed p-4 sm:p-5 cursor-pointer transition-all duration-150 ${
                        dragOver ? "border-teal bg-teal/5" : show("photo") ? "border-red-300 bg-red-50/40" : "border-slate-200 hover:border-teal/50 hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element -- inline base64 data URL, nothing for next/image to optimize */}
                        {photo ? <img src={photo.dataUrl} alt="Preview" className="w-full h-full object-cover" /> : <Icon.User width={28} height={28} className="text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                        <p className="text-sm font-semibold text-slate-700">
                          {photo ? "Change photo" : "Tap to upload"}<span className="hidden sm:inline text-slate-400 font-normal">, or drag and drop</span>
                          {!photo && <span className="text-amber ml-0.5">*</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">JPG or PNG · auto-resized to fit our 200KB limit</p>
                        {photo && <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1"><Icon.Check width={11} height={11} /> Ready — {Math.round(photo.bytes / 1024)}KB</p>}
                        {photoError && <p className="text-[11px] text-red-500 mt-1.5">{photoError}</p>}
                        {!photo && !photoError && show("photo") && <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1"><Icon.AlertTriangle width={11} height={11} /> {err("photo")}</p>}
                      </div>
                      {compressing && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                          <span className="w-4 h-4 border-2 border-slate-300 border-t-teal rounded-full animate-spin" /> Processing…
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className={sectionTitleCls}>Basic information</h2>
                    <div className="space-y-4">
                      <Field error={err("name")} showError={show("name")} label="Student's full name" required>
                        <input className={inputCls(show("name"))} value={form.name} onChange={(e) => u("name", e.target.value)} onBlur={() => touch("name")} />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field error={err("clubId")} showError={show("clubId")} label="Branch" required>
                          <select className={inputCls(show("clubId"))} value={form.clubId} onChange={(e) => u("clubId", e.target.value)} onBlur={() => touch("clubId")}>
                            <option value="">-- Select --</option>
                            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </Field>
                        <Field error={err("program")} showError={show("program")} label="Program">
                          <select className={inputCls(false)} value={form.program} onChange={(e) => u("program", e.target.value)}>
                            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                          </select>
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field error={err("mobile")} showError={show("mobile")} label="Mobile no" required>
                          <input className={inputCls(show("mobile"))} placeholder="+880 1XXX XXXXXX" value={form.mobile} onChange={(e) => u("mobile", e.target.value)} onBlur={() => touch("mobile")} />
                        </Field>
                        <Field error={err("email")} showError={show("email")} label="Email" required hint="Used to log in">
                          <input type="email" className={inputCls(show("email"))} value={form.email} onChange={(e) => u("email", e.target.value)} onBlur={() => touch("email")} />
                        </Field>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <div>
                  <h2 className={sectionTitleCls}>Address</h2>
                  <div className="space-y-4">
                    <Field error={err("presentAddress")} showError={show("presentAddress")} label="Present address" required>
                      <textarea className={inputCls(show("presentAddress")) + " min-h-[80px] resize-y"} value={form.presentAddress} onChange={(e) => u("presentAddress", e.target.value)} onBlur={() => touch("presentAddress")} />
                    </Field>
                    <label className="flex items-center gap-2.5 text-sm font-medium text-slate-600 py-1">
                      <input type="checkbox" checked={form.sameAsPresent} onChange={(e) => u("sameAsPresent", e.target.checked)} className="w-4.5 h-4.5 accent-teal" />
                      Permanent address is the same as present address
                    </label>
                    {!form.sameAsPresent && (
                      <Field error={err("permanentAddress")} showError={show("permanentAddress")} label="Permanent address" required>
                        <textarea className={inputCls(show("permanentAddress")) + " min-h-[80px] resize-y"} value={form.permanentAddress} onChange={(e) => u("permanentAddress", e.target.value)} onBlur={() => touch("permanentAddress")} />
                      </Field>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className={sectionTitleCls}>Guardian's information</h2>
                  <div className="space-y-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Father</div>
                    <Field error={err("fatherName")} showError={show("fatherName")} label="Father's name" required>
                      <input className={inputCls(show("fatherName"))} value={form.fatherName} onChange={(e) => u("fatherName", e.target.value)} onBlur={() => touch("fatherName")} />
                    </Field>
                    <Field error={err("fatherNid")} showError={show("fatherNid")} label="Father's NID" required>
                      <input className={inputCls(show("fatherNid"))} value={form.fatherNid} onChange={(e) => u("fatherNid", e.target.value)} onBlur={() => touch("fatherNid")} />
                    </Field>
                    <Field error={err("fatherOccupation")} showError={show("fatherOccupation")} label="Father's occupation" required>
                      <input className={inputCls(show("fatherOccupation"))} value={form.fatherOccupation} onChange={(e) => u("fatherOccupation", e.target.value)} onBlur={() => touch("fatherOccupation")} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field error={err("fatherOccupationType")} showError={show("fatherOccupationType")} label="Occupation type" required>
                        <select className={inputCls(show("fatherOccupationType"))} value={form.fatherOccupationType} onChange={(e) => u("fatherOccupationType", e.target.value)} onBlur={() => touch("fatherOccupationType")}>
                          <option value="">--</option><option>Govt.</option><option>Non Govt.</option><option>Others</option>
                        </select>
                      </Field>
                      <Field error={err("fatherMobile")} showError={show("fatherMobile")} label="Father's mobile" required>
                        <input className={inputCls(show("fatherMobile"))} value={form.fatherMobile} onChange={(e) => u("fatherMobile", e.target.value)} onBlur={() => touch("fatherMobile")} />
                      </Field>
                    </div>

                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide pt-2">Mother</div>
                    <Field error={err("motherName")} showError={show("motherName")} label="Mother's name" required>
                      <input className={inputCls(show("motherName"))} value={form.motherName} onChange={(e) => u("motherName", e.target.value)} onBlur={() => touch("motherName")} />
                    </Field>
                    <Field error={err("motherNid")} showError={show("motherNid")} label="Mother's NID" required>
                      <input className={inputCls(show("motherNid"))} value={form.motherNid} onChange={(e) => u("motherNid", e.target.value)} onBlur={() => touch("motherNid")} />
                    </Field>
                    <Field error={err("motherOccupation")} showError={show("motherOccupation")} label="Mother's occupation" required>
                      <input className={inputCls(show("motherOccupation"))} value={form.motherOccupation} onChange={(e) => u("motherOccupation", e.target.value)} onBlur={() => touch("motherOccupation")} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field error={err("motherOccupationType")} showError={show("motherOccupationType")} label="Occupation type" required>
                        <select className={inputCls(show("motherOccupationType"))} value={form.motherOccupationType} onChange={(e) => u("motherOccupationType", e.target.value)} onBlur={() => touch("motherOccupationType")}>
                          <option value="">--</option><option>Govt.</option><option>Non Govt.</option><option>Others</option>
                        </select>
                      </Field>
                      <Field error={err("motherMobile")} showError={show("motherMobile")} label="Mother's mobile" required>
                        <input className={inputCls(show("motherMobile"))} value={form.motherMobile} onChange={(e) => u("motherMobile", e.target.value)} onBlur={() => touch("motherMobile")} />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className={sectionTitleCls}>Applicant's details</h2>
                  <div className="space-y-4">
                    <Field error={err("dob")} showError={show("dob")} label="Date of birth" required>
                      <div className="grid grid-cols-3 gap-3">
                        <select className={inputCls(show("dob"))} value={form.dobDay} onChange={(e) => u("dobDay", e.target.value)} onBlur={() => touch("dob")}><option value="">Day</option>{DAYS.map((d) => <option key={d} value={d}>{Number(d)}</option>)}</select>
                        <select className={inputCls(show("dob"))} value={form.dobMonth} onChange={(e) => u("dobMonth", e.target.value)} onBlur={() => touch("dob")}><option value="">Month</option>{MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                        <select className={inputCls(show("dob"))} value={form.dobYear} onChange={(e) => u("dobYear", e.target.value)} onBlur={() => touch("dob")}><option value="">Year</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select>
                      </div>
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field error={err("birthReg")} showError={show("birthReg")} label="Birth registration no." required>
                        <input className={inputCls(show("birthReg"))} value={form.birthReg} onChange={(e) => u("birthReg", e.target.value)} onBlur={() => touch("birthReg")} />
                      </Field>
                      <Field error={err("bloodGroup")} showError={show("bloodGroup")} label="Blood group" required>
                        <input className={inputCls(show("bloodGroup"))} placeholder="e.g. O+" value={form.bloodGroup} onChange={(e) => u("bloodGroup", e.target.value)} onBlur={() => touch("bloodGroup")} />
                      </Field>
                    </div>
                    <Field error={err("presentSchool")} showError={show("presentSchool")} label="Present school" required>
                      <input className={inputCls(show("presentSchool"))} value={form.presentSchool} onChange={(e) => u("presentSchool", e.target.value)} onBlur={() => touch("presentSchool")} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field error={err("religion")} showError={show("religion")} label="Religion" required>
                        <select className={inputCls(false)} value={form.religion} onChange={(e) => u("religion", e.target.value)}>
                          <option>ISLAM</option><option>HINDU</option><option>CHRISTIAN</option>
                        </select>
                      </Field>
                      <Field error={err("gender")} showError={show("gender")} label="Gender" required>
                        <select className={inputCls(show("gender"))} value={form.gender} onChange={(e) => u("gender", e.target.value)} onBlur={() => touch("gender")}>
                          <option value="">-- Select --</option><option>MALE</option><option>FEMALE</option>
                        </select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field error={err("shift")} showError={show("shift")} label="Shift" required>
                        <select className={inputCls(show("shift"))} value={form.shift} onChange={(e) => u("shift", e.target.value)} onBlur={() => touch("shift")}>
                          <option value="">-- Select --</option><option>MORNING</option><option>DAY</option>
                        </select>
                      </Field>
                      <div>
                        <label className={labelCls}>Session</label>
                        <input className={inputCls(false) + " bg-slate-50 text-slate-500"} value={CURRENT_YEAR} readOnly />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <>
                  <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- inline base64 data URL */}
                      {photo ? <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" /> : <Icon.User width={20} height={20} className="text-slate-300" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{form.name || "Applicant"}</p>
                      <p className="text-xs text-slate-500 truncate">{clubs.find((c) => c.id === form.clubId)?.name || "No branch selected"} · {form.mobile || "No mobile"}</p>
                    </div>
                  </div>

                  <div>
                    <h2 className={sectionTitleCls}>Create your login</h2>
                    <p className="text-xs text-slate-500 -mt-2.5 mb-4">Use <span className="font-medium text-slate-600">{form.email || "the email above"}</span> with this password to sign in anytime and check schedules, attendance, and fee receipts.</p>
                    <div className="space-y-4">
                      <Field error={err("password")} showError={show("password")} label="Password" required hint="Minimum 8 characters">
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} className={inputCls(show("password")) + " pr-11"} value={form.password} onChange={(e) => u("password", e.target.value)} onBlur={() => touch("password")} />
                          <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                            <Icon.Eye width={16} height={16} />
                          </button>
                        </div>
                      </Field>
                      <Field error={err("confirmPassword")} showError={show("confirmPassword")} label="Confirm password" required>
                        <input type={showPassword ? "text" : "password"} className={inputCls(show("confirmPassword"))} value={form.confirmPassword} onChange={(e) => u("confirmPassword", e.target.value)} onBlur={() => touch("confirmPassword")} />
                      </Field>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 text-sm text-slate-600 bg-slate-50 rounded-xl p-4">
                    <input type="checkbox" checked={form.agree} onChange={(e) => { u("agree", e.target.checked); touch("agree"); }} className="w-4.5 h-4.5 accent-teal mt-0.5 flex-shrink-0" />
                    <span>I confirm that all the information provided is correct. Once submitted, this form can't be edited — please review carefully before submitting.</span>
                  </label>
                  {show("agree") && <p className="text-[11px] text-red-500 -mt-4 flex items-center gap-1"><Icon.AlertTriangle width={11} height={11} /> {err("agree")}</p>}
                </>
              )}
            </div>

            {/* Bottom action bar — fixed on mobile so it behaves like a native app's
                footer nav instead of forcing a scroll to a submit button 30 fields down. */}
            <div
              className="fixed sm:static bottom-0 inset-x-0 z-20 bg-white/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-none border-t sm:border-0 border-slate-100 px-5 sm:px-10 py-3 sm:py-0 sm:mt-8 sm:mb-10 flex items-center gap-3"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              {step > 0 && (
                <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm active:bg-slate-50 hover:border-slate-300 transition-all">
                  <Icon.ArrowLeft width={15} height={15} /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={goNext} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-teal text-white font-semibold py-3 rounded-xl hover:bg-teal-dark hover:shadow-md active:scale-[0.98] transition-all duration-150 shadow-sm">
                  Continue <Icon.ChevronRight width={16} height={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!formValid || submitting}
                  className="flex-1 bg-teal text-white font-semibold py-3 rounded-xl hover:bg-teal-dark active:scale-[0.98] transition-all duration-150 disabled:opacity-60 shadow-sm hover:shadow-glow-teal flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                  ) : "Submit Admission Form"}
                </button>
              )}
            </div>
          </form>

          {step === 0 && (
            <p className="text-xs text-slate-400 text-center pb-8 sm:pb-0 sm:mt-6">
              Already have an account? <Link href="/login" className="text-teal font-semibold hover:underline">Log in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(8).max(128);
export const idSchema = z.string().trim().min(1).max(100);
export const programSchema = z.enum(["Beginner", "Intermediate", "Advanced"]);
export const paymentMethodSchema = z.enum(["cash", "bkash", "nagad", "rocket", "bank_transfer"]);
export const paymentTypeSchema = z.enum(["monthly_fee", "admission_fee", "equipment", "event_fee"]);

export const loginSchema = z.object({ email: emailSchema, password: passwordSchema });
export const studentCreateSchema = z.object({
  name: z.string().trim().min(2).max(100), email: emailSchema, password: passwordSchema,
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  age: z.coerce.number().int().min(3).max(100).nullable().optional(),
  guardian: z.string().trim().min(2).max(100), program: programSchema.optional(), clubId: idSchema.nullable().optional(),
});
export const instructorCreateSchema = z.object({
  name: z.string().trim().min(2).max(100), email: emailSchema, password: passwordSchema,
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  specialization: z.string().trim().max(100).optional().or(z.literal("")), clubId: idSchema.nullable().optional(),
});
export const paymentCreateSchema = z.object({
  studentId: idSchema, amount: z.coerce.number().int().positive().max(10000000),
  method: paymentMethodSchema.default("cash"), type: paymentTypeSchema.default("monthly_fee"),
  month: z.string().trim().min(1).max(40),
});
export const attendanceCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({ studentId: idSchema, status: z.enum(["present", "absent"]) })).max(1000),
});
export const noticeCreateSchema = z.object({
  title: z.string().trim().min(2).max(160), body: z.string().trim().min(2).max(5000),
  audience: z.string().trim().min(1).max(120).default("All"), urgent: z.boolean().default(false),
});
export const scheduleCreateSchema = z.object({
  day: z.enum(["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
  time: z.string().trim().min(3).max(60), program: programSchema,
  clubId: idSchema, instructorId: idSchema,
});
export const passwordChangeSchema = z.object({ currentPassword: passwordSchema, newPassword: passwordSchema.refine((v) => /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v), "Use upper, lower and number") });
export const clubCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(150),
});
export const clubUpdateSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(100).optional(),
  location: z.string().trim().min(2).max(150).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
export const roleChangeSchema = z.object({
  userId: idSchema,
  role: z.enum(["admin", "instructor"]),
});
export const instructorUpdateSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  specialization: z.string().trim().max(100).optional().or(z.literal("")),
  clubId: idSchema.nullable().optional(),
});

// Full public admission form. Photo is a data: URL capped well above the
// form's own stated 200KB source-image limit to allow for base64 overhead
// (~33%) plus a JPEG/PNG header margin.
const requiredText = (min, max) => z.string().trim().min(min, "Required").max(max);
const dobSchema = z.object({
  day: z.string().regex(/^([0-2][0-9]|3[01])$/),
  month: z.string().regex(/^(0[1-9]|1[0-2])$/),
  year: z.string().regex(/^(19|20)\d{2}$/),
});

export const admissionSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
  mobile: z.string().trim().min(6).max(30),
  clubId: idSchema.nullable().optional(),

  presentAddress: z.string().trim().min(5).max(2000),
  sameAsPresent: z.boolean().optional(),
  permanentAddress: z.string().trim().min(5).max(2000),

  fatherName: z.string().trim().min(2).max(100),
  fatherNid: requiredText(2, 50),
  fatherOccupation: requiredText(2, 100),
  fatherOccupationType: z.enum(["Govt.", "Non Govt.", "Others"]),
  fatherMobile: requiredText(6, 30),

  motherName: z.string().trim().min(2).max(100),
  motherNid: requiredText(2, 50),
  motherOccupation: requiredText(2, 100),
  motherOccupationType: z.enum(["Govt.", "Non Govt.", "Others"]),
  motherMobile: requiredText(6, 30),

  dob: dobSchema,
  birthReg: requiredText(2, 50),
  bloodGroup: requiredText(1, 10),
  presentSchool: requiredText(2, 150),
  religion: z.enum(["ISLAM", "HINDU", "CHRISTIAN"]),
  gender: z.enum(["MALE", "FEMALE"]),

  shift: z.enum(["MORNING", "DAY"]),
  program: programSchema.optional(),
  photo: z.string().min(1, "Photo is required").max(400_000),

  agree: z.literal(true, { errorMap: () => ({ message: "You must confirm the information is correct" }) }),
});
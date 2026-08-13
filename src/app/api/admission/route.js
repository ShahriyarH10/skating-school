import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/access";
import { json, signToken, setAuthCookie } from "@/lib/auth";
import { admissionSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

function ageFromDob(dob) {
  if (!dob) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday = today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

// Public self-service admission: anyone can submit this form, no login
// required. Role is hardcoded to `student` and never taken from the
// request body, so this endpoint can't be used to mint instructor/admin
// accounts. Rate-limited per IP to deter spam/abuse, same-origin checked
// like every other mutating route.
export async function POST(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`admission:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return json({ error: "Too many admission attempts. Try again later." }, 429, { "Retry-After": String(limit.retryAfter) });

  const parsed = admissionSchema.safeParse(await request.json());
  if (!parsed.success) return json({ error: "Please check the form for errors", details: parsed.error.flatten().fieldErrors }, 400);
  const data = parsed.data;

  let clubId = null;
  if (data.clubId) {
    const club = await db.club.findFirst({ where: { id: data.clubId, status: "active" } });
    if (!club) return json({ error: "Please select a valid branch" }, 400);
    clubId = club.id;
  }

  let dob = null;
  if (data.dob) {
    dob = new Date(Date.UTC(Number(data.dob.year), Number(data.dob.month) - 1, Number(data.dob.day)));
    if (dob > new Date()) return json({ error: "Date of birth can't be in the future" }, 400);
  }

  const permanentAddress = data.sameAsPresent ? data.presentAddress : data.permanentAddress;

  try {
    const hash = await bcrypt.hash(data.password, 12);
    const user = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: data.email,
          password: hash,
          name: data.name,
          phone: data.mobile,
          role: "student",
          avatar: data.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase(),
        },
      });

      await tx.student.create({
      data: {
        userId: createdUser.id,
        clubId,
        program: data.program || "Beginner",
        guardian: data.fatherName || data.motherName,
        age: ageFromDob(dob),
        presentAddress: data.presentAddress,
        permanentAddress,
        fatherName: data.fatherName,
        fatherNid: data.fatherNid || null,
        fatherOccupation: data.fatherOccupation || null,
        fatherOccupationType: data.fatherOccupationType || null,
        fatherMobile: data.fatherMobile || null,
        motherName: data.motherName,
        motherNid: data.motherNid || null,
        motherOccupation: data.motherOccupation || null,
        motherOccupationType: data.motherOccupationType || null,
        motherMobile: data.motherMobile || null,
        dob,
        birthReg: data.birthReg || null,
        bloodGroup: data.bloodGroup || null,
        presentSchool: data.presentSchool || null,
        religion: data.religion || null,
        gender: data.gender,
        shift: data.shift,
        session: String(new Date().getFullYear()),
        photo: data.photo || null,
      },
      });

      return createdUser;
    });

    // Sign them in immediately — no separate login step required.
    const token = await signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    await setAuthCookie(token, request);

    return json({ success: true }, 201);
  } catch (err) {
    if (err.code === "P2002") return json({ error: "An account with this email already exists. Try logging in instead." }, 409);
    console.error("Admission error", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}

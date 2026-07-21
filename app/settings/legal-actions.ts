"use server";

import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

export async function acceptCurrentLegalTerms() {
  const profile = await getDefaultProfile();
  await prisma.legalAcceptance.upsert({
    where: { profileId_termsVersion_privacyVersion: { profileId: profile.id, termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION } },
    update: { acceptedAt: new Date() },
    create: { profileId: profile.id, termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION },
  });
}

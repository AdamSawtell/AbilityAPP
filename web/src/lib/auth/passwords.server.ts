import { LEADERSHIP_LOGIN_PASSWORDS } from "@/lib/access/leadership-login-seed";

/** Dev login passwords when Supabase is unavailable. Keys are usernames. */
export const SEED_LOGIN_PASSWORDS: Record<string, string> = {
  SuperUser: "flamingo",
  IslaRobinson: "welcome",
  GabrielaWilson: "welcome",
  PatriciaChen: "welcome",
  MichaelSmith: "welcome",
  PiperCollins: "welcome",
  DianeFoster: "welcome",
  JamesWhitford: "welcome",
  SamRivera: "welcome",
  MargaretHolt: "welcome",
  RileyShaw: "welcome",
  ...LEADERSHIP_LOGIN_PASSWORDS,
};

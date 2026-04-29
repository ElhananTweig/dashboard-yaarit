import type { DashboardSnapshot, Office, Task, TaskAssignee, TaskType } from "./types";

export const OFFICES: Office[] = [
  { id: "kikar",   name: "כיכר השבת", logo: "/assets/kikar.png",   logoBg: "#0a0a0a", brand: "#dc2626", meta: "חדשות חרדיות" },
  { id: "srugim",  name: "סרוגים",    logo: "/assets/srugim.png",  logoBg: "#ffffff", brand: "#0891b2", meta: "דתי־לאומי" },
  { id: "bavli",   name: "בבלי",      logo: "/assets/bavli.png",   logoBg: "#f5f0e6", brand: "#525252", meta: "קריאייטיב" },
  { id: "expendo", name: "אקספנדו",   logo: "/assets/expendo.png", logoBg: "#f5f0e6", brand: "#d97706", meta: "פרסום" },
  { id: "jfeed",   name: "JFEED",     logo: "/assets/jfeed.png",   logoBg: "#ffffff", brand: "#ef4444", meta: "בינלאומי" },
];

export const DEPARTMENTS = ["תוכן", "שיווק", "אולפן", "מדיה", "סושיאל"];

let taskSeq = 0;
/** Mock tasks are seeded as if created "now" — so the daily cleanup never sweeps them on first load. */
const seedCreatedAt = () => new Date().toISOString();
const t = (
  officeId: string,
  dept: string,
  type: TaskType,
  text: string,
  assignee: TaskAssignee = "יערית",
): Task => ({
  id: `t_${++taskSeq}`,
  officeId,
  dept,
  type,
  assignee,
  text,
  createdAt: seedCreatedAt(),
});

const officeTasks: Record<string, Record<string, Task[]>> = {
  kikar: {
    "תוכן":   [t("kikar","תוכן","יומי","כתבה ראשית · בוקר"), t("kikar","תוכן","יומי","סיכום מהדורת ערב"), t("kikar","תוכן","קבוע","ניוזלטר שבועי")],
    "שיווק":  [t("kikar","שיווק","קבוע","ביצועי Google Ads"), t("kikar","שיווק","יומי","דחיפת כותרות")],
    "אולפן":  [t("kikar","אולפן","יומי","ריאיון 10:00"), t("kikar","אולפן","יומי","הקלטת פודקאסט")],
    "מדיה":   [t("kikar","מדיה","יומי","עריכת קליפ לטלגרם"), t("kikar","מדיה","קבוע","בנק תמונות")],
    "סושיאל": [t("kikar","סושיאל","יומי","פוסט טוויטר"), t("kikar","סושיאל","קבוע","×3 טיקטוקים")],
  },
  srugim: {
    "תוכן":   [t("srugim","תוכן","יומי","טור דעה · בוקר"), t("srugim","תוכן","קבוע","״שבוע בארץ״")],
    "שיווק":  [t("srugim","שיווק","יומי","קמפיין שבוע הספר"), t("srugim","שיווק","קבוע","מועדון קוראים")],
    "אולפן":  [t("srugim","אולפן","קבוע","פודקאסט יום ראשון")],
    "מדיה":   [t("srugim","מדיה","יומי","כתבת וידאו"), t("srugim","מדיה","יומי","תמונת שער")],
    "סושיאל": [t("srugim","סושיאל","יומי","ריל אינסטגרם"), t("srugim","סושיאל","קבוע","ניהול קבוצת WhatsApp")],
  },
  bavli: {
    "תוכן":   [t("bavli","תוכן","קבוע","אסטרטגיית Q2"), t("bavli","תוכן","יומי","תדריך לקוח")],
    "שיווק":  [t("bavli","שיווק","יומי","סטטוס לקוח"), t("bavli","שיווק","קבוע","דוח חודשי")],
    "אולפן":  [t("bavli","אולפן","יומי","צילום קמפיין")],
    "מדיה":   [t("bavli","מדיה","קבוע","ניהול רכישות"), t("bavli","מדיה","יומי","LinkedIn")],
    "סושיאל": [t("bavli","סושיאל","יומי","פוסט לקוח A"), t("bavli","סושיאל","יומי","פוסט לקוח B")],
  },
  expendo: {
    "תוכן":   [t("expendo","תוכן","יומי","בריף קריאייטיב"), t("expendo","תוכן","יומי","תסריט ברנד")],
    "שיווק":  [t("expendo","שיווק","קבוע","תחקור מתחרים")],
    "אולפן":  [t("expendo","אולפן","יומי","צילום וידאו"), t("expendo","אולפן","יומי","קריינות")],
    "מדיה":   [t("expendo","מדיה","יומי","יעדי Meta"), t("expendo","מדיה","קבוע","אסטרטגיית פריסה")],
    "סושיאל": [t("expendo","סושיאל","יומי","העלאת ריל"), t("expendo","סושיאל","קבוע","קלנדר חודשי")],
  },
  jfeed: {
    "תוכן":   [t("jfeed","תוכן","יומי","Morning brief EN"), t("jfeed","תוכן","יומי","Top stories"), t("jfeed","תוכן","קבוע","Weekly long-read")],
    "שיווק":  [t("jfeed","שיווק","קבוע","International SEO")],
    "אולפן":  [t("jfeed","אולפן","יומי","Live news clip"), t("jfeed","אולפן","קבוע","Podcast — weekly")],
    "מדיה":   [t("jfeed","מדיה","יומי","Thumbnail batch"), t("jfeed","מדיה","יומי","Cuts to X")],
    "סושיאל": [t("jfeed","סושיאל","יומי","X thread"), t("jfeed","סושיאל","יומי","Reels recap")],
  },
};

const managementRows = [
  {
    id: "mgmt_1",
    name: "אסטרטגיה",
    tasks: [
      t("mgmt", "אסטרטגיה", "קבוע", "תכנון רבעוני Q3"),
      t("mgmt", "אסטרטגיה", "יומי", "פגישת בוקר מנכ״לים"),
    ],
  },
  {
    id: "mgmt_2",
    name: "כספים",
    tasks: [
      t("mgmt", "כספים", "קבוע", "דוח רווח והפסד"),
      t("mgmt", "כספים", "יומי", "אישור הוצאות"),
    ],
  },
  {
    id: "mgmt_3",
    name: "משאבי אנוש",
    tasks: [
      t("mgmt", "משאבי אנוש", "יומי", "ראיונות גיוס"),
      t("mgmt", "משאבי אנוש", "קבוע", "שיחות 1:1 חודשיות"),
    ],
  },
  {
    id: "mgmt_4",
    name: "משפטי",
    tasks: [t("mgmt", "משפטי", "קבוע", "מעקב חוזים פעילים")],
  },
];

export const initialSnapshot: DashboardSnapshot = {
  offices: OFFICES,
  departments: DEPARTMENTS,
  officeTasks,
  managementRows,
};

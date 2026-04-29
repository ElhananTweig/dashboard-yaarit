import { loadCalendarData } from "@/lib/sheets/repository";
import DepartmentCalendar from "@/components/calendar/DepartmentCalendar";

export const dynamic = "force-dynamic";

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function isValidYearMonth(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: { officeId: string };
  searchParams: { month?: string };
}) {
  const { officeId } = params;
  const rawMonth = searchParams.month ?? "";
  const yearMonth = isValidYearMonth(rawMonth) ? rawMonth : currentYearMonth();

  const data = await loadCalendarData(officeId, yearMonth);

  return (
    <DepartmentCalendar
      officeId={officeId}
      office={data.office}
      yearMonth={yearMonth}
      yomiByDate={data.yomiByDate}
      kavuaTasks={data.kavuaTasks}
      departments={data.departments}
    />
  );
}

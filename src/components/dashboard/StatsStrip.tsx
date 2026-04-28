"use client";

interface StatsStripProps {
  total: number;
  yomi: number;
  kavua: number;
  weeklyRate: number;
}

const Spark = ({ d, color }: { d: string; color: string }) => (
  <svg className="spark" viewBox="0 0 70 22" preserveAspectRatio="none">
    <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function StatsStrip({ total, yomi, kavua, weeklyRate }: StatsStripProps) {
  return (
    <section className="stats">
      <div className="stat reveal">
        <div className="label">סך משימות</div>
        <div className="value">
          {total}
          <span className="delta up">▲ 4</span>
        </div>
        <Spark d="M0 16 L10 14 L20 17 L30 10 L40 12 L50 6 L60 8 L70 4" color="#22c55e" />
      </div>
      <div className="stat reveal">
        <div className="label">
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--yomi)",
              display: "inline-block",
            }}
          />
          משימות יומיות
        </div>
        <div className="value">
          {yomi}
          <span className="delta up">▲ 2</span>
        </div>
        <Spark d="M0 12 L10 8 L20 14 L30 6 L40 10 L50 4 L60 9 L70 7" color="#f97316" />
      </div>
      <div className="stat reveal">
        <div className="label">
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--kavua)",
              display: "inline-block",
            }}
          />
          משימות קבועות
        </div>
        <div className="value">
          {kavua}
          <span className="delta">→ 0</span>
        </div>
        <Spark d="M0 14 L10 14 L20 12 L30 13 L40 11 L50 12 L60 10 L70 11" color="#6366f1" />
      </div>
      <div className="stat reveal">
        <div className="label">קצב שבועי</div>
        <div className="value">
          {weeklyRate}%<span className="delta up">▲ 6%</span>
        </div>
        <Spark d="M0 18 L10 16 L20 12 L30 14 L40 8 L50 10 L60 5 L70 3" color="#22c55e" />
      </div>
    </section>
  );
}

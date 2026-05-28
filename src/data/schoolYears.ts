import type { CalendarEvent, SchoolYear, Term } from "../types";

const source = {
  title: "2025-2026学年校历",
  url: "https://pkuschool.yuque.com/xqt6kg/gq1l46/haq6b2oyf8t7k7hg#uPWH",
  extractedFrom: "Brave logged-in Yuque rendered spreadsheet copy",
  extractedAt: "2026-05-28"
};

const event = (
  id: string,
  title: string,
  date: string,
  category: CalendarEvent["category"],
  extra: Omit<CalendarEvent, "id" | "title" | "date" | "category"> = {}
): CalendarEvent => ({
  id,
  title,
  date,
  category,
  source: extra.source ?? "yuque-copy",
  ...extra
});

const officialEvent = (
  id: string,
  title: string,
  date: string,
  category: CalendarEvent["category"],
  extra: Omit<CalendarEvent, "id" | "title" | "date" | "category" | "source"> = {}
): CalendarEvent => event(id, title, date, category, { source: "official-pdf", ...extra });

const addCycleWeek = (
  prefix: string,
  week: number,
  rows: Array<[string, string]>
): CalendarEvent[] =>
  rows.map(([date, label], index) =>
    event(`${prefix}-cycle-${week}-${index}`, label, date, "cycle", {
      audience: `教学周 ${week}`
    })
  );

const fallCycleEvents: CalendarEvent[] = [
  ...addCycleWeek("fall", 1, [
    ["2025-09-01", "①A"],
    ["2025-09-02", "①B"],
    ["2025-09-03", "①C"],
    ["2025-09-04", "①D"],
    ["2025-09-05", "①E"]
  ]),
  ...addCycleWeek("fall", 2, [
    ["2025-09-08", "②A"],
    ["2025-09-09", "②B"],
    ["2025-09-10", "②C"],
    ["2025-09-11", "②D"],
    ["2025-09-12", "②E"]
  ]),
  ...addCycleWeek("fall", 3, [
    ["2025-09-15", "③A"],
    ["2025-09-16", "③B"],
    ["2025-09-17", "③C"],
    ["2025-09-18", "③D"],
    ["2025-09-19", "③E"]
  ]),
  ...addCycleWeek("fall", 4, [
    ["2025-09-22", "④A"],
    ["2025-09-23", "④B"],
    ["2025-09-24", "④C"],
    ["2025-09-25", "④D"],
    ["2025-09-26", "④E"],
    ["2025-09-28", "C"]
  ]),
  ...addCycleWeek("fall", 5, [
    ["2025-09-29", "⑤A"],
    ["2025-09-30", "⑤B"]
  ]),
  ...addCycleWeek("fall", 6, [
    ["2025-10-09", "⑤C"],
    ["2025-10-10", "⑤D"],
    ["2025-10-11", "⑤E"]
  ]),
  ...addCycleWeek("fall", 7, [
    ["2025-10-13", "⑥A"],
    ["2025-10-14", "⑥B"],
    ["2025-10-15", "⑥C"],
    ["2025-10-16", "⑥D"],
    ["2025-10-17", "⑥E"]
  ]),
  ...addCycleWeek("fall", 8, [
    ["2025-10-20", "⑦A"],
    ["2025-10-21", "⑦B"],
    ["2025-10-22", "⑦C"],
    ["2025-10-23", "⑦D"],
    ["2025-10-24", "⑦E"]
  ]),
  ...addCycleWeek("fall", 9, [
    ["2025-10-27", "⑧A"],
    ["2025-10-28", "⑧B"],
    ["2025-10-29", "⑧C"],
    ["2025-10-30", "⑧D"],
    ["2025-10-31", "⑧E"]
  ]),
  ...addCycleWeek("fall", 10, [
    ["2025-11-03", "⑨A"],
    ["2025-11-04", "⑨B"],
    ["2025-11-05", "⑨C"],
    ["2025-11-06", "⑨D"],
    ["2025-11-07", "⑨E"]
  ]),
  ...addCycleWeek("fall", 11, [["2025-11-10", "A"]]),
  ...addCycleWeek("fall", 12, [
    ["2025-11-17", "⑩A"],
    ["2025-11-18", "⑩B"],
    ["2025-11-19", "⑩C"],
    ["2025-11-20", "⑩D"],
    ["2025-11-21", "⑩E"]
  ]),
  ...addCycleWeek("fall", 13, [
    ["2025-11-24", "⑪A"],
    ["2025-11-25", "⑪B"],
    ["2025-11-26", "⑪C"],
    ["2025-11-27", "⑪D"],
    ["2025-11-28", "⑪E"]
  ]),
  ...addCycleWeek("fall", 14, [
    ["2025-12-01", "⑫A"],
    ["2025-12-02", "⑫B"],
    ["2025-12-03", "⑫C"],
    ["2025-12-04", "⑫D"],
    ["2025-12-05", "⑫E"]
  ]),
  ...addCycleWeek("fall", 15, [
    ["2025-12-08", "⑬A"],
    ["2025-12-09", "⑬B"],
    ["2025-12-10", "⑬C"],
    ["2025-12-11", "⑬D"],
    ["2025-12-12", "⑬E"]
  ]),
  ...addCycleWeek("fall", 16, [
    ["2025-12-15", "⑭A"],
    ["2025-12-16", "⑭B"],
    ["2025-12-17", "⑭C"],
    ["2025-12-18", "⑭D"],
    ["2025-12-19", "⑭E"]
  ]),
  ...addCycleWeek("fall", 17, [
    ["2025-12-22", "⑮A"],
    ["2025-12-23", "⑮B"],
    ["2025-12-24", "⑮C"],
    ["2025-12-25", "⑮D"],
    ["2025-12-26", "⑮E"]
  ]),
  ...addCycleWeek("fall", 18, [
    ["2025-12-29", "⑯A"],
    ["2025-12-30", "⑯B"],
    ["2025-12-31", "⑯C"],
    ["2026-01-02", "⑯E"]
  ]),
  ...addCycleWeek("fall", 19, [
    ["2026-01-05", "⑰A"],
    ["2026-01-06", "⑰B"],
    ["2026-01-07", "⑰C"],
    ["2026-01-08", "⑰D"],
    ["2026-01-09", "⑰E"]
  ]),
  ...addCycleWeek("fall", 20, [
    ["2026-01-12", "⑱A"],
    ["2026-01-13", "⑱B"],
    ["2026-01-14", "⑱C"],
    ["2026-01-15", "⑱D"],
    ["2026-01-16", "⑱E"]
  ]),
  ...addCycleWeek("fall", 22, [
    ["2026-01-26", "A"],
    ["2026-01-27", "B"],
    ["2026-01-28", "C"],
    ["2026-01-29", "D"],
    ["2026-01-30", "E"]
  ])
];

const springCycleEvents: CalendarEvent[] = [
  ...addCycleWeek("spring", 1, [
    ["2026-03-02", "①A"],
    ["2026-03-03", "①B"],
    ["2026-03-04", "①C"],
    ["2026-03-05", "①D"],
    ["2026-03-06", "①E"]
  ]),
  ...addCycleWeek("spring", 2, [
    ["2026-03-09", "②A"],
    ["2026-03-10", "②B"],
    ["2026-03-11", "②C"],
    ["2026-03-12", "②D"],
    ["2026-03-13", "②E"]
  ]),
  ...addCycleWeek("spring", 3, [
    ["2026-03-16", "③A"],
    ["2026-03-17", "③B"],
    ["2026-03-18", "③C"],
    ["2026-03-19", "③D"],
    ["2026-03-20", "③E"]
  ]),
  ...addCycleWeek("spring", 4, [
    ["2026-03-23", "④A"],
    ["2026-03-24", "④B"],
    ["2026-03-25", "④C"],
    ["2026-03-26", "④D"],
    ["2026-03-27", "④E"]
  ]),
  ...addCycleWeek("spring", 5, [
    ["2026-03-30", "⑤A"],
    ["2026-03-31", "⑤B"],
    ["2026-04-01", "⑤C"],
    ["2026-04-02", "⑤D"],
    ["2026-04-03", "⑤E"]
  ]),
  ...addCycleWeek("spring", 6, [
    ["2026-04-07", "⑥B"],
    ["2026-04-08", "⑥C"],
    ["2026-04-09", "⑥D"],
    ["2026-04-10", "⑥E"]
  ]),
  ...addCycleWeek("spring", 7, [
    ["2026-04-13", "⑦A"],
    ["2026-04-14", "⑦B"],
    ["2026-04-15", "⑦C"],
    ["2026-04-16", "⑦D"],
    ["2026-04-17", "⑦E"]
  ]),
  ...addCycleWeek("spring", 8, [
    ["2026-04-20", "⑧A"],
    ["2026-04-21", "⑧B"],
    ["2026-04-22", "⑧C"],
    ["2026-04-23", "⑧D"],
    ["2026-04-24", "⑧E"]
  ]),
  ...addCycleWeek("spring", 11, [
    ["2026-05-11", "⑨A"],
    ["2026-05-12", "⑨B"],
    ["2026-05-13", "⑨C"],
    ["2026-05-14", "⑨D"],
    ["2026-05-15", "⑨E"]
  ]),
  ...addCycleWeek("spring", 12, [
    ["2026-05-18", "⑩A"],
    ["2026-05-19", "⑩B"],
    ["2026-05-20", "⑩C"],
    ["2026-05-21", "⑩D"],
    ["2026-05-22", "⑩E"]
  ]),
  ...addCycleWeek("spring", 13, [
    ["2026-05-25", "⑪A"],
    ["2026-05-26", "⑪B"],
    ["2026-05-27", "⑪C"],
    ["2026-05-28", "⑪D"],
    ["2026-05-29", "⑪E"]
  ]),
  ...addCycleWeek("spring", 14, [
    ["2026-06-01", "⑫A"],
    ["2026-06-02", "⑫B"],
    ["2026-06-03", "⑫C"],
    ["2026-06-04", "⑫D"],
    ["2026-06-05", "⑫E"]
  ]),
  ...addCycleWeek("spring", 15, [
    ["2026-06-08", "⑬A"],
    ["2026-06-09", "⑬B"],
    ["2026-06-10", "⑬C"],
    ["2026-06-11", "⑬D"],
    ["2026-06-12", "⑬E"]
  ]),
  ...addCycleWeek("spring", 16, [
    ["2026-06-15", "⑭A"],
    ["2026-06-16", "⑭B"],
    ["2026-06-17", "⑭C"],
    ["2026-06-18", "⑭D"]
  ]),
  ...addCycleWeek("spring", 17, [
    ["2026-06-22", "⑮A"],
    ["2026-06-23", "⑮B"],
    ["2026-06-24", "⑮C"],
    ["2026-06-25", "⑮D"],
    ["2026-06-26", "⑮E"]
  ]),
  ...addCycleWeek("spring", 18, [
    ["2026-06-29", "⑯A"],
    ["2026-06-30", "⑯B"],
    ["2026-07-01", "⑯C"],
    ["2026-07-02", "⑯D"],
    ["2026-07-03", "⑯E"]
  ]),
  ...addCycleWeek("spring", 19, [["2026-07-06", "⑰A"]]),
  ...addCycleWeek("spring", 20, [
    ["2026-07-13", "⑱A"],
    ["2026-07-14", "⑱B"]
  ])
];

const fallTerm: Term = {
  id: "fall",
  label: "第一学期",
  rangeLabel: "2025.09 - 2026.03",
  start: "2025-09-01",
  end: "2026-03-01",
  focusMonths: ["九月", "十月", "十一月", "十二月", "一月"],
  events: [
    event("fall-start", "开学", "2025-09-01", "ceremony"),
    event("fall-basketball-open", "篮球赛开幕式", "2025-09-25", "sports"),
    event("fall-national-holiday", "国庆节、中秋节假期", "2025-10-01", "holiday", {
      endDate: "2025-10-08"
    }),
    event("fall-anniversary", "建校65周年主题活动日", "2025-10-12", "ceremony"),
    event("fall-basketball-award", "篮球赛颁奖典礼", "2025-10-30", "sports"),
    event("fall-midterm", "期中考试", "2025-11-11", "exam", { endDate: "2025-11-13" }),
    event("fall-midterm-review", "期中讲评 / 试卷讲评", "2025-11-14", "exam"),
    event("fall-drama-open", "戏剧节开幕式", "2025-12-04", "activity"),
    event("fall-english-listening", "高考英语听说第一次考试", "2025-12-13", "exam"),
    event("fall-drama-award", "戏剧节颁奖典礼", "2025-12-25", "activity"),
    event("fall-new-year", "元旦放假", "2026-01-01", "holiday", { endDate: "2026-01-03" }),
    event("fall-it-exam", "信息技术合格考", "2026-01-10", "exam"),
    event("fall-general-tech-exam", "通用技术合格考", "2026-01-17", "exam"),
    event("fall-final", "期末考试", "2026-01-19", "exam", { endDate: "2026-01-21" }),
    event("fall-qualification", "学业水平合格考", "2026-01-22", "exam", {
      endDate: "2026-01-24"
    }),
    event("fall-winter-vacation", "寒假", "2026-01-31", "holiday", { endDate: "2026-03-01" }),
    event("fall-practice-0905", "“Hi 导师”见面会", "2025-09-05", "practice"),
    event("fall-practice-0912", "研学讲座 / 英语统练", "2025-09-12", "practice", {
      audience: "高一 / 高二"
    }),
    event("fall-practice-0919", "研学导学 / 人工智能", "2025-09-19", "practice", {
      audience: "高一 / 高二"
    }),
    event("fall-practice-0926", "语文统练", "2025-09-26", "practice"),
    event("fall-clean-1011", "扫除", "2025-10-11", "cleanup"),
    event("fall-practice-1017", "数学统练", "2025-10-17", "practice"),
    event("fall-practice-1024", "英语统练 / 六选三统练", "2025-10-24", "practice", {
      audience: "高一 / 高二"
    }),
    event("fall-practice-1031", "开题报告 / 地理学科、数智芯时代", "2025-10-31", "practice", {
      audience: "高一 / 高二"
    }),
    event("fall-practice-1107", "地理学科 / 数学学科", "2025-11-07", "practice", {
      audience: "高一 / 高二"
    }),
    event("fall-clean-1121", "扫除", "2025-11-21", "cleanup"),
    event("fall-practice-1128", "英语学科 / 语文学科", "2025-11-28", "practice", {
      audience: "高一 / 高二"
    }),
    event("fall-practice-1205", "历史学科 / 英语统练", "2025-12-05", "practice", {
      audience: "高一 / 高二"
    }),
    event("fall-practice-1212", "语文统练", "2025-12-12", "practice"),
    event("fall-practice-1219", "数学统练", "2025-12-19", "practice"),
    event("fall-practice-1226", "英语统练 / 六选三统练", "2025-12-26", "practice", {
      audience: "高一 / 高二"
    }),
    event("fall-self-study-0109", "自习", "2026-01-09", "note"),
    event("fall-practice-0116", "结题报告 / 自习", "2026-01-16", "practice", {
      audience: "高一 / 高二"
    }),
    event("fall-clean-0130", "扫除", "2026-01-30", "cleanup"),
    ...fallCycleEvents
  ]
};

const springTerm: Term = {
  id: "spring",
  label: "第二学期",
  rangeLabel: "2026.03 - 2026.07",
  start: "2026-03-02",
  end: "2026-07-14",
  focusMonths: ["三月", "四月", "五月", "六月", "七月"],
  events: [
    event("spring-start", "开学", "2026-03-02", "ceremony"),
    event("spring-math-festival", "数学节", "2026-03-12", "activity", { endDate: "2026-03-13" }),
    event("spring-football-open", "书院杯足球赛开幕式", "2026-03-19", "sports"),
    event("spring-speaking", "英语听说考试", "2026-03-21", "exam"),
    event("spring-pe-exam", "体育学考", "2026-03-24", "exam", { endDate: "2026-03-30" }),
    event("spring-gaga", "嘎嘎节", "2026-04-02", "activity"),
    event("spring-qingming", "清明节", "2026-04-04", "holiday", { endDate: "2026-04-06" }),
    event("spring-gaosan-mock-1", "高三一模", "2026-04-07", "exam", { endDate: "2026-04-10" }),
    event("spring-football-close", "书院杯足球赛闭幕式", "2026-04-23", "sports"),
    event("spring-midterm", "期中考试", "2026-04-27", "exam", { endDate: "2026-04-30" }),
    event("spring-labor", "劳动节", "2026-05-01", "holiday"),
    event("spring-gaoyi-practice", "高一社会实践活动", "2026-05-06", "activity", {
      endDate: "2026-05-09",
      audience: "高一"
    }),
    event("spring-gaosan-mock-2", "高三二模", "2026-05-06", "exam", { endDate: "2026-05-09" }),
    event("spring-apio", "APIO", "2026-05-07", "activity", { endDate: "2026-05-10" }),
    event("spring-home-school", "家校沟通", "2026-05-16", "activity"),
    event("spring-open-day", "校园开放日", "2026-05-24", "activity"),
    event("spring-gaokao", "高考", "2026-06-07", "exam", { endDate: "2026-06-10" }),
    event("spring-dance-open", "舞蹈节开幕式", "2026-06-11", "activity"),
    event("spring-graduation", "毕业典礼", "2026-06-14", "ceremony"),
    event("spring-it-exam", "信息学考", "2026-06-15", "exam", { endDate: "2026-06-17" }),
    event("spring-dragon-boat", "端午节", "2026-06-19", "holiday", { endDate: "2026-06-21" }),
    event("spring-academic-level", "学业水平考试", "2026-06-27", "exam", {
      endDate: "2026-06-29"
    }),
    event("spring-dance-close", "舞蹈节闭幕式", "2026-07-02", "activity"),
    event("spring-general-exam", "通用学考", "2026-07-03", "exam"),
    event("spring-final", "期末考试", "2026-07-07", "exam", { endDate: "2026-07-09" }),
    event("spring-final-review", "讲评", "2026-07-10", "exam"),
    event("spring-clean-0306", "大扫除", "2026-03-06", "cleanup"),
    event("spring-practice-0320", "英语", "2026-03-20", "practice"),
    event("spring-practice-0327", "语文", "2026-03-27", "practice"),
    event("spring-practice-0403", "物理 / 六选三", "2026-04-03", "practice", {
      audience: "高一 / 高二"
    }),
    event("spring-practice-0410", "数学", "2026-04-10", "practice"),
    event("spring-clean-0417", "大扫除", "2026-04-17", "cleanup"),
    event("spring-reading-0424", "读书节", "2026-04-24", "activity"),
    event("spring-practice-0508", "高一社会实践 / 高二生物", "2026-05-08", "practice"),
    event("spring-clean-0515", "大扫除", "2026-05-15", "cleanup"),
    event("spring-practice-0522", "语文", "2026-05-22", "practice"),
    event("spring-practice-0529", "英语（高一练习、高二活动）", "2026-05-29", "practice"),
    event("spring-practice-0605", "数学", "2026-06-05", "practice"),
    event("spring-practice-0612", "合格考模拟：历史、生物 / 六选三", "2026-06-12", "practice", {
      audience: "高一 / 高二"
    }),
    event("spring-practice-0626", "合格考模拟：地理、化学 / 英语", "2026-06-26", "practice", {
      audience: "高一 / 高二"
    }),
    event("spring-practice-0703", "学科活动待定", "2026-07-03", "practice"),
    event("spring-no-arrangement", "不安排", "2026-07-10", "note"),
    event("spring-clean-0714", "大扫除", "2026-07-14", "cleanup"),
    ...springCycleEvents
  ]
};

export const ACTIVE_SCHOOL_YEAR_ID = "2025-2026-high";

const prepPlaceholderTerm = (id: Term["id"], label: string, rangeLabel: string, start: string, end: string): Term => ({
  id,
  label,
  rangeLabel,
  start,
  end,
  focusMonths: id === "fall" ? ["九月", "十月", "十一月", "十二月", "一月"] : ["三月", "四月", "五月", "六月", "七月"],
  events: []
});

const prepSpringCycleEvents: CalendarEvent[] = [
  ...addCycleWeek("prep-spring", 0, [
    ["2026-02-24", "答疑B"],
    ["2026-02-25", "答疑C"],
    ["2026-02-26", "答疑D"],
    ["2026-02-27", "答疑E"],
    ["2026-02-28", "答疑F"]
  ]),
  ...addCycleWeek("prep-spring", 1, [
    ["2026-03-02", "A"],
    ["2026-03-03", "B"],
    ["2026-03-04", "C"],
    ["2026-03-05", "D"],
    ["2026-03-06", "E"],
    ["2026-03-07", "F"]
  ]),
  ...addCycleWeek("prep-spring", 2, [
    ["2026-03-09", "A"],
    ["2026-03-10", "B"],
    ["2026-03-11", "C"],
    ["2026-03-12", "D"],
    ["2026-03-13", "E"],
    ["2026-03-14", "F"]
  ]),
  ...addCycleWeek("prep-spring", 3, [
    ["2026-03-16", "A"],
    ["2026-03-17", "B"],
    ["2026-03-18", "C"],
    ["2026-03-19", "D"],
    ["2026-03-20", "E"]
  ]),
  ...addCycleWeek("prep-spring", 4, [
    ["2026-03-23", "A"],
    ["2026-03-24", "B"],
    ["2026-03-25", "C"],
    ["2026-03-26", "D"],
    ["2026-03-27", "E"],
    ["2026-03-28", "F"]
  ]),
  ...addCycleWeek("prep-spring", 5, [
    ["2026-03-30", "A"],
    ["2026-03-31", "B"],
    ["2026-04-01", "C"],
    ["2026-04-02", "D"],
    ["2026-04-03", "E"]
  ]),
  ...addCycleWeek("prep-spring", 6, [
    ["2026-04-06", "答疑A"],
    ["2026-04-11", "拓展实践"]
  ]),
  ...addCycleWeek("prep-spring", 7, [
    ["2026-04-13", "A"],
    ["2026-04-14", "B"],
    ["2026-04-15", "C"],
    ["2026-04-16", "D"],
    ["2026-04-17", "E"],
    ["2026-04-18", "F"]
  ]),
  ...addCycleWeek("prep-spring", 8, [
    ["2026-04-20", "A"],
    ["2026-04-21", "B"],
    ["2026-04-22", "C"],
    ["2026-04-23", "D"],
    ["2026-04-24", "E"],
    ["2026-04-25", "F"]
  ]),
  ...addCycleWeek("prep-spring", 9, [
    ["2026-04-27", "A"],
    ["2026-04-28", "B"],
    ["2026-04-29", "C"],
    ["2026-04-30", "D"]
  ]),
  ...addCycleWeek("prep-spring", 10, [
    ["2026-05-05", "答疑B"],
    ["2026-05-11", "拍毕业照A"],
    ["2026-05-12", "B"],
    ["2026-05-13", "C"],
    ["2026-05-14", "D"],
    ["2026-05-15", "E"],
    ["2026-05-16", "F"],
    ["2026-05-18", "A"],
    ["2026-05-19", "B"],
    ["2026-05-20", "C"],
    ["2026-05-21", "D"],
    ["2026-05-22", "E"],
    ["2026-05-23", "F"]
  ])
];

const prepSpringTerm: Term = {
  id: "spring",
  label: "第二学期",
  rangeLabel: "2026.02 - 2026.05（截图可见部分）",
  start: "2026-02-24",
  end: "2026-05-24",
  focusMonths: ["二月", "三月", "四月", "五月"],
  events: [
    event("prep-spring-start", "开学", "2026-03-02", "ceremony"),
    event("prep-spring-gaozhao-medical", "高招体检", "2026-03-04", "exam"),
    event("prep-spring-speaking", "高考英语听说第二次考试", "2026-03-21", "exam"),
    event("prep-spring-pe-exam", "高中体育学考", "2026-03-24", "exam", { endDate: "2026-03-30" }),
    event("prep-spring-qingming", "清明节", "2026-04-04", "holiday", { endDate: "2026-04-05" }),
    event("prep-spring-mock-1", "一模考试", "2026-04-07", "exam", { endDate: "2026-04-10" }),
    event("prep-spring-outreach", "学生拓展实践", "2026-04-11", "activity"),
    event("prep-spring-labor", "劳动节", "2026-05-01", "holiday", { endDate: "2026-05-04" }),
    event("prep-spring-mock-2", "二模考试", "2026-05-06", "exam", { endDate: "2026-05-09" }),
    event("prep-spring-graduation-photo", "毕业照", "2026-05-11", "activity"),
    ...prepSpringCycleEvents
  ]
};

const juniorSource = {
  title: "通知公告-北大附中初中部",
  url: "https://czpkuschool.pku.edu.cn/tzgg.htm",
  extractedFrom: "Official junior-division notice PDFs",
  extractedAt: "2026-05-28"
};

const juniorFall2025: Term = {
  id: "fall",
  label: "第一学期",
  rangeLabel: "2025.09 - 2026.03",
  start: "2025-09-01",
  end: "2026-03-01",
  focusMonths: ["九月", "十月", "十一月", "十二月", "一月"],
  events: [
    event("junior-2025-fall-start", "开学", "2025-09-01", "ceremony"),
    event("junior-2025-fall-practice", "爱国主义教育实践活动", "2025-09-03", "activity"),
    event("junior-2025-fall-science", "海淀区科学节", "2025-09-01", "activity", {
      endDate: "2025-09-30",
      note: "官方校历标注为 2025 年 9 月"
    }),
    event("junior-2025-fall-education", "海淀区教育大会", "2025-09-14", "activity"),
    event("junior-2025-fall-fengcai", "风采杯中学教师教学成果展示活动", "2025-09-01", "activity", {
      endDate: "2025-10-31"
    }),
    event("junior-2025-fall-fitness", "八年级国家学生体质健康测试统测", "2025-10-01", "exam", {
      endDate: "2025-10-31"
    }),
    event("junior-2025-fall-teaching-work", "海淀区中学教学工作会", "2025-10-21", "activity", {
      endDate: "2025-10-31",
      note: "官方校历标注为 2025 年 10 月下旬"
    }),
    event("junior-2025-fall-midterm", "期中考试", "2025-11-04", "exam", { endDate: "2025-11-06" }),
    event("junior-2025-fall-speaking", "初中学考英语听说第一次考试", "2025-12-01", "exam", {
      note: "官方校历标注为 2025 年 12 月待定"
    }),
    event("junior-2025-fall-final", "初中各年级期末考试", "2026-01-13", "exam", {
      endDate: "2026-01-15"
    }),
    event("junior-2025-fall-end", "初中学期结束", "2026-01-23", "ceremony"),
    event("junior-2025-winter", "寒假", "2026-01-24", "holiday", { endDate: "2026-03-01" })
  ]
};

const juniorSpring2026: Term = {
  id: "spring",
  label: "第二学期",
  rangeLabel: "2026.03 - 2026.08",
  start: "2026-03-02",
  end: "2026-08-31",
  focusMonths: ["三月", "四月", "五月", "六月", "七月"],
  events: [
    event("junior-2026-spring-start", "开学", "2026-03-02", "ceremony"),
    event("junior-2026-zhongzhao-medical", "中招体检", "2026-03-06", "exam", { endDate: "2026-04-23" }),
    event("junior-2026-speaking", "初中学考英语听说第二次考试", "2026-03-22", "exam"),
    event("junior-2026-sports-quality", "初中学考体育现场考试：素质项目", "2026-04-09", "exam", {
      endDate: "2026-04-18"
    }),
    event("junior-2026-sports-quality-makeup", "初中学考体育素质项目缓考", "2026-04-24", "exam"),
    event("junior-2026-midterm", "非毕业年级期中考试", "2026-04-21", "exam", { endDate: "2026-04-23" }),
    event("junior-2026-chusan-mock-1", "初三一模", "2026-04-21", "exam", { endDate: "2026-04-22" }),
    event("junior-2026-adaptive", "初三历史、化学；初二地理、生物适应性练习", "2026-04-23", "exam"),
    event("junior-2026-art-music", "初中学考音乐、美术考试", "2026-04-21", "exam", {
      endDate: "2026-04-30",
      note: "官方校历标注为 4 月下旬"
    }),
    event("junior-2026-sports-ability-1", "初中学考体育现场考试：运动能力项目", "2026-05-16", "exam", {
      endDate: "2026-05-17"
    }),
    event("junior-2026-sports-ability-2", "初中学考体育现场考试：运动能力项目", "2026-05-23", "exam", {
      endDate: "2026-05-24"
    }),
    event("junior-2026-sports-ability-makeup", "初中学考体育运动能力项目缓考", "2026-05-30", "exam"),
    event("junior-2026-chusan-mock-2", "初三二模", "2026-05-26", "exam", { endDate: "2026-05-27" }),
    event("junior-2026-history-chem", "初中化学、历史学业水平考试（笔试）", "2026-05-28", "exam"),
    event("junior-2026-junior-level", "初中学业水平考试", "2026-06-24", "exam", { endDate: "2026-06-25" }),
    event("junior-2026-final", "初中各年级期末考试", "2026-06-30", "exam", { endDate: "2026-07-02" }),
    event("junior-2026-bio-geo", "初中地理、生物学业水平考试（笔试）", "2026-07-02", "exam"),
    event("junior-2026-end", "初中学期结束", "2026-07-07", "ceremony"),
    event("junior-2026-summer", "暑假", "2026-07-08", "holiday", { endDate: "2026-08-31" })
  ]
};

const juniorFall2024: Term = {
  id: "fall",
  label: "第一学期",
  rangeLabel: "2024.09 - 2025.02",
  start: "2024-09-01",
  end: "2025-02-16",
  focusMonths: ["九月", "十月", "十一月", "十二月", "一月"],
  events: [
    event("junior-2024-fall-start", "开学", "2024-09-01", "ceremony"),
    event("junior-2024-fall-teaching", "海淀区中学教学工作会", "2024-10-01", "activity", {
      endDate: "2024-10-31"
    }),
    event("junior-2024-fall-fitness", "八年级国家学生体质健康测试统测", "2024-10-01", "exam", {
      endDate: "2024-10-31"
    }),
    event("junior-2024-fall-midterm", "期中考试", "2024-11-05", "exam", { endDate: "2024-11-07" }),
    event("junior-2024-fall-speaking", "初中学考英语听说第一次考试", "2024-12-01", "exam", {
      note: "官方校历标注为 2024 年 12 月待定"
    }),
    event("junior-2024-fall-final", "初中各年级期末考试", "2025-01-07", "exam", { endDate: "2025-01-09" }),
    event("junior-2024-fall-end", "初中学期结束", "2025-01-11", "ceremony"),
    event("junior-2024-winter", "寒假", "2025-01-12", "holiday", { endDate: "2025-02-16" })
  ]
};

const juniorSpring2025: Term = {
  id: "spring",
  label: "第二学期",
  rangeLabel: "2025.02 - 2025.08",
  start: "2025-02-17",
  end: "2025-08-31",
  focusMonths: ["二月", "三月", "四月", "五月", "六月", "七月"],
  events: [
    event("junior-2025-spring-start", "开学", "2025-02-17", "ceremony"),
    event("junior-2025-education", "海淀区教育大会", "2025-03-01", "activity", {
      endDate: "2025-03-31"
    }),
    event("junior-2025-medical", "中招体检", "2025-03-01", "exam", { endDate: "2025-04-30" }),
    event("junior-2025-speaking", "初中学考英语听说第二次考试", "2025-03-16", "exam"),
    event("junior-2025-sports-quality", "初中学考体育现场考试：素质项目", "2025-04-09", "exam", {
      endDate: "2025-04-18"
    }),
    event("junior-2025-sports-quality-makeup", "初中学考体育素质项目缓考", "2025-04-25", "exam"),
    event("junior-2025-midterm", "非毕业年级期中考试、初三一模", "2025-04-22", "exam", {
      endDate: "2025-04-24"
    }),
    event("junior-2025-adaptive", "初三历史、化学；初二地理、生物适应性练习", "2025-04-24", "exam"),
    event("junior-2025-art-music", "初中学考音乐、美术考试", "2025-04-21", "exam", {
      endDate: "2025-04-30",
      note: "官方校历标注为 4 月下旬"
    }),
    event("junior-2025-sports-ability-1", "初中学考体育现场考试：运动能力项目", "2025-05-10", "exam", {
      endDate: "2025-05-11"
    }),
    event("junior-2025-sports-ability-2", "初中学考体育现场考试：运动能力项目", "2025-05-17", "exam", {
      endDate: "2025-05-18"
    }),
    event("junior-2025-sports-ability-makeup", "初中学考体育运动能力项目缓考", "2025-05-24", "exam"),
    event("junior-2025-chusan-mock-2", "初三二模", "2025-05-26", "exam", { endDate: "2025-05-27" }),
    event("junior-2025-history-chem", "初中化学、历史学业水平考试（笔试）", "2025-05-28", "exam"),
    event("junior-2025-junior-level", "初中学考", "2025-06-24", "exam", { endDate: "2025-06-26" }),
    event("junior-2025-final", "初中各年级期末考试", "2025-07-01", "exam", { endDate: "2025-07-03" }),
    event("junior-2025-bio-geo", "初中地理、生物学业水平考试（笔试）", "2025-07-03", "exam"),
    event("junior-2025-end", "初中学期结束", "2025-07-06", "ceremony"),
    event("junior-2025-summer", "暑假", "2025-07-07", "holiday", { endDate: "2025-08-31" })
  ]
};

export const SCHOOL_YEARS: SchoolYear[] = [
  {
    id: "2025-2026-high",
    label: "2025-2026学年",
    yearId: "2025-2026",
    divisionId: "high",
    division: "高中部",
    activeTermId: "spring",
    source,
    terms: [fallTerm, springTerm]
  },
  {
    id: "2025-2026-prep",
    label: "2025-2026学年",
    yearId: "2025-2026",
    divisionId: "prep",
    division: "预科部",
    status: "partial-source",
    activeTermId: "spring",
    source,
    terms: [
      prepPlaceholderTerm("fall", "第一学期", "2025.09 - 2026.02", "2025-09-01", "2026-02-01"),
      prepSpringTerm
    ]
  },
  {
    id: "2025-2026-junior",
    label: "2025-2026学年",
    yearId: "2025-2026",
    divisionId: "junior",
    division: "初中部",
    activeTermId: "spring",
    source: juniorSource,
    terms: [juniorFall2025, juniorSpring2026]
  },
  {
    id: "2024-2025-junior",
    label: "2024-2025学年",
    yearId: "2024-2025",
    divisionId: "junior",
    division: "初中部",
    activeTermId: "spring",
    source: juniorSource,
    terms: [juniorFall2024, juniorSpring2025]
  }
];

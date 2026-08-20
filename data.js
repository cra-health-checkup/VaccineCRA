// ---------------------------------------------------------------------------
// Reference config: vaccines & lab tests in scope (core occupational-health set)
// Codes sourced from "Code วัคซีนและแลป.xlsx" provided by the user.
// ---------------------------------------------------------------------------

const VACCINE_META = {
  Influenza: {
    label: "Influenza (ไข้หวัดใหญ่)",
    requiredDoses: 1,
    requiredNote: "1 เข็ม/ปี",
    color: "blue",
    brands: [
      { name: "Influvac", code: "1200002280" },
      { name: "Vaxigrip", code: "1200001088" },
      { name: "Skycellflu", code: "1200002745" },
      { name: "Efluelda", code: "1200002219" },
    ],
  },
  HBV: {
    label: "HBV (ไวรัสตับอักเสบบี)",
    requiredDoses: 3,
    requiredNote: "3 เข็ม",
    color: "teal",
    brands: [
      { name: "Engerix-B", code: "1200001079" },
      { name: "Hepatitis B vaccine (MASU)", code: "200002165" },
    ],
  },
  MMR: {
    label: "MMR (หัด หัดเยอรมัน คางทูม)",
    requiredDoses: 2,
    requiredNote: "2 เข็ม",
    color: "blue",
    brands: [
      { name: "MMR vaccine (MASU)", code: "1200001092" },
    ],
  },
  Varicella: {
    label: "Varicella (อีสุกอีใส)",
    requiredDoses: 2,
    requiredNote: "2 เข็ม",
    color: "teal",
    brands: [
      { name: "Varilrix", code: "1200001101" },
      { name: "Varivax", code: "1200001102" },
    ],
  },
  TdapTd: {
    label: "Tdap / Td (บาดทะยัก คอตีบ ไอกรน)",
    requiredDoses: 1,
    requiredNote: "1 เข็ม + กระตุ้น Td ทุก 10 ปี",
    color: "blue",
    brands: [
      { name: "Adacel", code: "1200002112" },
      { name: "Boostrix", code: "1200001100" },
      { name: "Tetanus toxoid", code: "1200000722" },
    ],
  },
  HAV: {
    label: "HAV (ไวรัสตับอักเสบเอ)",
    requiredDoses: 2,
    requiredNote: "2 เข็ม",
    color: "teal",
    brands: [
      { name: "Avaxim 160 iu", code: "1200002195" },
    ],
  },
};

const LAB_META = [
  { test: "HBsAg", code: "CHK5030 / 50300", related: "HBV" },
  { test: "Anti-HBs", code: "50301 / CHK5031", related: "HBV" },
  { test: "Measles IgG", code: "51617", related: "MMR" },
  { test: "Rubella IgG", code: "CHK5160", related: "MMR" },
  { test: "Mumps IgG", code: "51619", related: "MMR" },
  { test: "Varicella IgG", code: "59912", related: "Varicella" },
  { test: "Anti-HAV total", code: "50201", related: "HAV" },
];

const RISK_GROUPS = ["1.1", "1.2", "1.3", "2", "3", "4"];

// ---------------------------------------------------------------------------
// Seed / sample data — fictional, matching the mock data used in the earlier
// Excel example, for demo purposes only.
// ---------------------------------------------------------------------------

function seedData() {
  return {
    employees: [
      { id: "EMP0001", hn: "HN0001234", name: "นางสาวสมหญิง ใจดี", division: "ฝ่ายการพยาบาล", position: "พยาบาลวิชาชีพ", riskGroup: "1.1", status: "Active", updatedAt: "2026-08-01" },
      { id: "EMP0002", hn: "HN0005678", name: "นายสมชาย รักษ์สุข", division: "ฝ่ายการแพทย์", position: "แพทย์", riskGroup: "1.1", status: "Active", updatedAt: "2026-08-01" },
      { id: "EMP0003", hn: "HN0009012", name: "นางสาวพิมพ์ชนก แข็งแรง", division: "ฝ่ายเภสัชกรรม", position: "เภสัชกร", riskGroup: "2", status: "Active", updatedAt: "2026-08-01" },
      { id: "EMP0004", hn: "HN0003456", name: "นายวรากร มั่นคง", division: "ฝ่ายโภชนาการ", position: "พนักงานประกอบอาหาร", riskGroup: "3", status: "Active", updatedAt: "2026-08-01" },
    ],
    vaccineRecords: {
      Influenza: [
        { id: rid(), empId: "EMP0001", date: "2024-10-10", brand: "Vaxigrip", code: "1200001088", lot: "LOT-FLU-24A", note: "" },
        { id: rid(), empId: "EMP0001", date: "2025-10-05", brand: "Vaxigrip", code: "1200001088", lot: "LOT-FLU-25A", note: "" },
        { id: rid(), empId: "EMP0002", date: "2025-10-06", brand: "Influvac", code: "1200002280", lot: "LOT-FLU-25B", note: "" },
        { id: rid(), empId: "EMP0003", date: "2025-10-08", brand: "Efluelda", code: "1200002219", lot: "LOT-FLU-25C", note: "" },
      ],
      HBV: [
        { id: rid(), empId: "EMP0001", date: "2023-01-10", brand: "Engerix-B", code: "1200001079", lot: "LOT-HBV-01", note: "เข็มที่ 1" },
        { id: rid(), empId: "EMP0001", date: "2023-02-10", brand: "Engerix-B", code: "1200001079", lot: "LOT-HBV-02", note: "เข็มที่ 2" },
        { id: rid(), empId: "EMP0001", date: "2023-07-10", brand: "Engerix-B", code: "1200001079", lot: "LOT-HBV-03", note: "เข็มที่ 3 (ครบ)" },
        { id: rid(), empId: "EMP0002", date: "2024-03-01", brand: "Engerix-B", code: "1200001079", lot: "LOT-HBV-04", note: "เข็มที่ 1" },
        { id: rid(), empId: "EMP0002", date: "2024-04-01", brand: "Engerix-B", code: "1200001079", lot: "LOT-HBV-05", note: "เข็มที่ 2 — ยังไม่ครบ" },
        { id: rid(), empId: "EMP0003", date: "2022-05-01", brand: "Engerix-B", code: "1200001079", lot: "LOT-HBV-06", note: "เข็มที่ 1" },
        { id: rid(), empId: "EMP0003", date: "2022-06-01", brand: "Engerix-B", code: "1200001079", lot: "LOT-HBV-07", note: "เข็มที่ 2" },
        { id: rid(), empId: "EMP0003", date: "2022-11-01", brand: "Engerix-B", code: "1200001079", lot: "LOT-HBV-08", note: "เข็มที่ 3 (ครบ)" },
      ],
      MMR: [
        { id: rid(), empId: "EMP0001", date: "2010-06-01", brand: "MMR vaccine (MASU)", code: "1200001092", lot: "LOT-MMR-01", note: "เข็มที่ 1" },
        { id: rid(), empId: "EMP0001", date: "2010-07-01", brand: "MMR vaccine (MASU)", code: "1200001092", lot: "LOT-MMR-02", note: "เข็มที่ 2 (ครบ)" },
        { id: rid(), empId: "EMP0002", date: "2015-01-01", brand: "MMR vaccine (MASU)", code: "1200001092", lot: "LOT-MMR-03", note: "เข็มที่ 1 — ยังไม่ครบ" },
        { id: rid(), empId: "EMP0003", date: "2018-02-01", brand: "MMR vaccine (MASU)", code: "1200001092", lot: "LOT-MMR-04", note: "เข็มที่ 1" },
        { id: rid(), empId: "EMP0003", date: "2018-03-01", brand: "MMR vaccine (MASU)", code: "1200001092", lot: "LOT-MMR-05", note: "เข็มที่ 2 (ครบ)" },
      ],
      Varicella: [
        { id: rid(), empId: "EMP0001", date: "2011-01-01", brand: "Varilrix", code: "1200001101", lot: "LOT-VAR-01", note: "เข็มที่ 1" },
        { id: rid(), empId: "EMP0001", date: "2011-02-15", brand: "Varilrix", code: "1200001101", lot: "LOT-VAR-02", note: "เข็มที่ 2 (ครบ)" },
        { id: rid(), empId: "EMP0003", date: "2019-05-01", brand: "Varivax", code: "1200001102", lot: "LOT-VAR-03", note: "เข็มที่ 1" },
        { id: rid(), empId: "EMP0003", date: "2019-06-15", brand: "Varivax", code: "1200001102", lot: "LOT-VAR-04", note: "เข็มที่ 2 (ครบ)" },
      ],
      TdapTd: [
        { id: rid(), empId: "EMP0001", date: "2021-01-01", brand: "Adacel", code: "1200002112", lot: "LOT-TDAP-01", note: "Tdap เข็มแรก" },
        { id: rid(), empId: "EMP0002", date: "2019-03-01", brand: "Boostrix", code: "1200001100", lot: "LOT-TDAP-02", note: "Tdap เข็มแรก" },
        { id: rid(), empId: "EMP0003", date: "2020-07-01", brand: "Adacel", code: "1200002112", lot: "LOT-TDAP-03", note: "Tdap เข็มแรก" },
        { id: rid(), empId: "EMP0004", date: "2015-01-01", brand: "Adacel", code: "1200002112", lot: "LOT-TDAP-04", note: "Tdap เข็มแรก" },
        { id: rid(), empId: "EMP0004", date: "2025-01-01", brand: "Tetanus toxoid", code: "1200000722", lot: "LOT-TD-01", note: "Td เข็มกระตุ้น (ครบ 10 ปี)" },
      ],
      HAV: [
        { id: rid(), empId: "EMP0001", date: "2022-01-01", brand: "Avaxim 160 iu", code: "1200002195", lot: "LOT-HAV-01", note: "เข็มที่ 1" },
        { id: rid(), empId: "EMP0001", date: "2022-07-01", brand: "Avaxim 160 iu", code: "1200002195", lot: "LOT-HAV-02", note: "เข็มที่ 2 (ครบ)" },
        { id: rid(), empId: "EMP0003", date: "2023-01-01", brand: "Avaxim 160 iu", code: "1200002195", lot: "LOT-HAV-03", note: "เข็มที่ 1" },
        { id: rid(), empId: "EMP0003", date: "2023-07-01", brand: "Avaxim 160 iu", code: "1200002195", lot: "LOT-HAV-04", note: "เข็มที่ 2 (ครบ)" },
      ],
    },
    labRecords: [
      { id: rid(), empId: "EMP0001", date: "2023-08-01", test: "HBsAg", code: "CHK5030 / 50300", result: "Negative", note: "" },
      { id: rid(), empId: "EMP0001", date: "2023-08-01", test: "Anti-HBs", code: "50301 / CHK5031", result: "Positive", note: "มีภูมิคุ้มกันหลังฉีดครบ" },
      { id: rid(), empId: "EMP0001", date: "2020-01-01", test: "Measles IgG", code: "51617", result: "Positive", note: "" },
      { id: rid(), empId: "EMP0001", date: "2020-01-01", test: "Rubella IgG", code: "CHK5160", result: "Positive", note: "" },
      { id: rid(), empId: "EMP0001", date: "2011-03-01", test: "Varicella IgG", code: "59912", result: "Positive", note: "" },
      { id: rid(), empId: "EMP0002", date: "2024-05-01", test: "HBsAg", code: "CHK5030 / 50300", result: "Negative", note: "" },
      { id: rid(), empId: "EMP0002", date: "2024-05-01", test: "Anti-HBs", code: "50301 / CHK5031", result: "Negative", note: "ฉีดยังไม่ครบ 3 เข็ม — แนะนำตรวจซ้ำหลังฉีดครบ" },
      { id: rid(), empId: "EMP0003", date: "2022-12-01", test: "HBsAg", code: "CHK5030 / 50300", result: "Negative", note: "" },
      { id: rid(), empId: "EMP0003", date: "2022-12-01", test: "Anti-HBs", code: "50301 / CHK5031", result: "Positive", note: "" },
      { id: rid(), empId: "EMP0003", date: "2018-04-01", test: "Mumps IgG", code: "51619", result: "Positive", note: "" },
      { id: rid(), empId: "EMP0003", date: "2023-08-01", test: "Anti-HAV total", code: "50201", result: "Positive", note: "" },
    ],
  };
}

function rid() {
  return "r" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

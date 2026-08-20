// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------
const STORAGE_KEY = "vaccine_platform_demo_v1";
let DATA = loadData();
let ROUTE = "overview";
let searchTerms = {}; // per-route search text

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn("localStorage read failed", e); }
  const seed = seedData();
  saveData(seed);
  return seed;
}
function saveData(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) { console.warn("localStorage write failed", e); }
}
function persist() { saveData(DATA); }

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}
function fmtDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function getEmployee(id) { return DATA.employees.find((e) => e.id === id); }
function empName(id) { const e = getEmployee(id); return e ? e.name : id; }
function empDivision(id) { const e = getEmployee(id); return e ? e.division : ""; }

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.add("hidden"), 2200);
}

function nextEmployeeId() {
  const nums = DATA.employees.map((e) => parseInt(e.id.replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return "EMP" + String(next).padStart(4, "0");
}

// ---------------------------------------------------------------------------
// Vaccine status computation (mirrors the COUNTIFS/MAXIFS logic in the Excel example)
// ---------------------------------------------------------------------------
function vaccineStatus(empId, key) {
  const meta = VACCINE_META[key];
  const records = (DATA.vaccineRecords[key] || []).filter((r) => r.empId === empId);
  const count = records.length;
  if (count === 0) return { count: 0, lastDate: null, status: "ยังไม่มีข้อมูล", badge: "muted" };
  const lastDate = records.map((r) => r.date).sort().slice(-1)[0];
  if (count >= meta.requiredDoses) return { count, lastDate, status: "ครบเกณฑ์", badge: "good" };
  return { count, lastDate, status: "ยังไม่ครบ", badge: "warn" };
}
function doseSeq(key, empId, date, excludeId) {
  const records = (DATA.vaccineRecords[key] || []).filter((r) => r.empId === empId && r.id !== excludeId);
  const dates = records.map((r) => r.date).concat([date]).sort();
  return dates.indexOf(date) + 1;
}
function latestLab(empId, test) {
  const recs = DATA.labRecords.filter((r) => r.empId === empId && r.test === test);
  if (!recs.length) return null;
  return recs.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-1)[0];
}

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------
const NAV = [
  { route: "overview", label: "ภาพรวม", icon: "◈" },
  { route: "employees", label: "ข้อมูลพนักงาน", icon: "◉" },
  { group: "ข้อมูลวัคซีน (รายครั้งที่ฉีด)" },
  ...Object.keys(VACCINE_META).map((k) => ({ route: "vaccine:" + k, label: VACCINE_META[k].label, icon: "✚", sub: true })),
  { group: "ข้อมูลภูมิคุ้มกัน" },
  { route: "lab", label: "ผลตรวจภูมิคุ้มกัน", icon: "🧪", sub: true },
  { group: "อ้างอิง" },
  { route: "codes", label: "รหัสอ้างอิง HIS/LIS", icon: "≡", sub: true },
];

function renderNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = "";
  NAV.forEach((item) => {
    if (item.group) {
      nav.appendChild(el("div", { class: "nav-group-label" }, item.group));
      return;
    }
    const active = ROUTE === item.route;
    const node = el(
      "div",
      {
        class: "nav-item" + (active ? " active" : "") + (item.sub ? " nav-sub" : ""),
        onclick: () => { ROUTE = item.route; render(); },
      },
      [el("span", { class: "nav-icon" }, item.icon), el("span", {}, item.label)]
    );
    nav.appendChild(node);
  });
}

// ---------------------------------------------------------------------------
// Modal helper
// ---------------------------------------------------------------------------
function openModal(title, hint, fields, onSubmit, submitLabel = "บันทึก") {
  const overlay = document.getElementById("modalOverlay");
  const box = document.getElementById("modalBox");
  box.innerHTML = "";
  box.appendChild(el("h3", {}, title));
  if (hint) box.appendChild(el("div", { class: "hint" }, hint));

  const inputs = {};
  fields.forEach((f) => {
    const row = el("div", { class: "form-row" }, [el("label", {}, f.label)]);
    let input;
    if (f.type === "select") {
      input = el("select", { name: f.name });
      (f.options || []).forEach((opt) => {
        const o = el("option", { value: opt.value }, opt.text);
        if (opt.value === f.value) o.selected = true;
        input.appendChild(o);
      });
      if (f.onChange) input.addEventListener("change", () => f.onChange(input.value, inputs));
    } else if (f.type === "textarea") {
      input = el("textarea", { name: f.name, rows: 2 });
      input.value = f.value || "";
    } else {
      input = el("input", { type: f.type || "text", name: f.name });
      input.value = f.value ?? "";
      if (f.type === "date") input.value = f.value || "";
    }
    if (f.readonly) input.setAttribute("readonly", "readonly");
    row.appendChild(input);
    box.appendChild(row);
    inputs[f.name] = input;
  });

  const actions = el("div", { class: "form-actions" });
  actions.appendChild(el("button", { class: "btn btn-cancel", onclick: closeModal }, "ยกเลิก"));
  actions.appendChild(
    el(
      "button",
      {
        class: "btn btn-primary",
        onclick: () => {
          const values = {};
          Object.entries(inputs).forEach(([k, v]) => (values[k] = v.value.trim()));
          const err = onSubmit(values);
          if (err) { showToast(err); return; }
          closeModal();
        },
      },
      submitLabel
    )
  );
  box.appendChild(actions);
  overlay.classList.remove("hidden");
}
function closeModal() { document.getElementById("modalOverlay").classList.add("hidden"); }
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "modalOverlay") closeModal();
});

// ---------------------------------------------------------------------------
// Page: Overview
// ---------------------------------------------------------------------------
function pageOverview(container) {
  const totalEmp = DATA.employees.length;
  const vaccineKeys = Object.keys(VACCINE_META);
  let fullyCompliant = 0, anyLab = 0, totalRecords = 0;
  Object.values(DATA.vaccineRecords).forEach((arr) => (totalRecords += arr.length));
  totalRecords += DATA.labRecords.length;
  DATA.employees.forEach((e) => {
    const allDone = vaccineKeys.every((k) => vaccineStatus(e.id, k).status === "ครบเกณฑ์");
    if (allDone) fullyCompliant++;
    if (DATA.labRecords.some((r) => r.empId === e.id)) anyLab++;
  });

  const kpis = el("div", { class: "kpi-row" }, [
    kpiCard("จำนวนบุคลากรทั้งหมด", totalEmp + " คน", "ในระบบตัวอย่างนี้", "blue"),
    kpiCard("ฉีดวัคซีนครบทุกชนิดหลัก", fullyCompliant + " คน", `จาก ${totalEmp} คน (6 ชนิดวัคซีน)`, "teal"),
    kpiCard("มีผลตรวจภูมิคุ้มกันแล้ว", anyLab + " คน", "อย่างน้อย 1 รายการตรวจ", "blue"),
    kpiCard("จำนวนบันทึกทั้งหมด", totalRecords + " รายการ", "รวมวัคซีน + ผลตรวจภูมิคุ้มกัน", "teal"),
  ]);
  container.appendChild(kpis);

  const card = el("div", { class: "card section-card" });
  card.appendChild(el("h3", {}, "ภาพรวมสรุปรายบุคคล"));
  card.appendChild(el("div", { class: "hint" }, "คำนวณสด (real-time) จากข้อมูลดิบทุกแท็บ — ลองเพิ่ม/แก้ไขข้อมูลในหน้าอื่นแล้วกลับมาดูหน้านี้ได้เลย"));

  const wrap = el("div", { class: "table-wrap" });
  const table = el("table");
  const thead = el("thead");
  const row1 = el("tr", { class: "group-hdr" });
  ["รหัสพนักงาน", "ชื่อ-นามสกุล", "กลุ่มความเสี่ยง"].forEach((h) => row1.appendChild(el("th", { rowspan: "2" }, h)));
  vaccineKeys.forEach((k) => row1.appendChild(el("th", { colspan: "3" }, VACCINE_META[k].label.split(" (")[0])));
  LAB_META.forEach((l) => row1.appendChild(el("th", { colspan: "2" }, l.test)));
  thead.appendChild(row1);

  const row2 = el("tr", { class: "group-hdr" });
  vaccineKeys.forEach(() => {
    ["เข็ม", "ล่าสุด", "สถานะ"].forEach((s) => row2.appendChild(el("th", {}, s)));
  });
  LAB_META.forEach(() => {
    ["วันที่ตรวจ", "ผล"].forEach((s) => row2.appendChild(el("th", {}, s)));
  });
  thead.appendChild(row2);
  table.appendChild(thead);

  const tbody = el("tbody");
  DATA.employees.forEach((e) => {
    const tr = el("tr");
    tr.appendChild(el("td", {}, e.id));
    tr.appendChild(el("td", {}, e.name));
    tr.appendChild(el("td", { class: "center" }, e.riskGroup));
    vaccineKeys.forEach((k) => {
      const s = vaccineStatus(e.id, k);
      tr.appendChild(el("td", { class: "center" }, String(s.count)));
      tr.appendChild(el("td", { class: "center" }, s.lastDate ? fmtDate(s.lastDate) : "-"));
      tr.appendChild(el("td", { class: "center" }, el("span", { class: "badge badge-" + s.badge }, s.status)));
    });
    LAB_META.forEach((l) => {
      const rec = latestLab(e.id, l.test);
      tr.appendChild(el("td", { class: "center" }, rec ? fmtDate(rec.date) : "-"));
      tr.appendChild(
        el("td", { class: "center" }, rec ? el("span", { class: "badge badge-" + (rec.result === "Positive" ? "good" : "bad") }, rec.result) : el("span", { class: "badge badge-muted" }, "-"))
      );
    });
    tbody.appendChild(tr);
  });
  if (!DATA.employees.length) tbody.appendChild(el("tr", { class: "empty-row" }, el("td", { colspan: "99" }, "ยังไม่มีข้อมูลพนักงาน")));
  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  container.appendChild(card);
}
function kpiCard(label, value, sub, color) {
  return el("div", { class: "card kpi-card" }, [
    el("div", { class: "kpi-label" }, [el("span", { class: "kpi-dot", style: `background:var(--${color})` }), label]),
    el("div", { class: "kpi-value" }, value),
    el("div", { class: "kpi-sub" }, sub),
  ]);
}

// ---------------------------------------------------------------------------
// Page: Employees
// ---------------------------------------------------------------------------
function pageEmployees(container) {
  const card = el("div", { class: "card section-card" });
  card.appendChild(el("h3", {}, "ข้อมูลพนักงาน (Master Data)"));
  card.appendChild(el("div", { class: "hint" }, "รหัสพนักงาน + HN คือคีย์หลักที่ใช้เชื่อมโยงกับข้อมูลวัคซีนและผลตรวจภูมิคุ้มกันทุกแท็บ"));

  const toolbar = el("div", { class: "toolbar" });
  const search = el("input", {
    class: "search-box", placeholder: "ค้นหาชื่อ / รหัสพนักงาน / HN...",
    value: searchTerms.employees || "",
    oninput: (e) => { searchTerms.employees = e.target.value; renderTable(); },
  });
  toolbar.appendChild(search);
  toolbar.appendChild(el("div", { class: "spacer" }));
  toolbar.appendChild(el("button", { class: "btn btn-primary", onclick: () => openEmployeeForm(null) }, "+ เพิ่มพนักงาน"));
  card.appendChild(toolbar);

  const wrap = el("div", { class: "table-wrap" });
  card.appendChild(wrap);
  container.appendChild(card);

  function renderTable() {
    wrap.innerHTML = "";
    const table = el("table");
    const thead = el("tr");
    ["รหัสพนักงาน", "HN", "ชื่อ-นามสกุล", "ส่วนงาน", "ตำแหน่ง", "กลุ่มเสี่ยง", "สถานะ", "อัปเดตล่าสุด", ""].forEach((h) =>
      thead.appendChild(el("th", {}, h))
    );
    table.appendChild(el("thead", {}, thead));
    const tbody = el("tbody");
    const term = (searchTerms.employees || "").toLowerCase();
    const rows = DATA.employees.filter(
      (e) => !term || e.name.toLowerCase().includes(term) || e.id.toLowerCase().includes(term) || e.hn.toLowerCase().includes(term)
    );
    rows.forEach((e) => {
      const tr = el("tr", {}, [
        el("td", {}, e.id),
        el("td", {}, e.hn),
        el("td", {}, e.name),
        el("td", {}, e.division),
        el("td", {}, e.position),
        el("td", { class: "center" }, el("span", { class: "badge badge-blue" }, e.riskGroup)),
        el("td", { class: "center" }, el("span", { class: "badge " + (e.status === "Active" ? "badge-good" : "badge-muted") }, e.status)),
        el("td", {}, fmtDate(e.updatedAt)),
        el("td", {}, [
          el("button", { class: "btn-edit-text", onclick: () => openEmployeeForm(e.id) }, "แก้ไข"),
          el("button", { class: "btn-danger-text", onclick: () => deleteEmployee(e.id) }, "ลบ"),
        ]),
      ]);
      tbody.appendChild(tr);
    });
    if (!rows.length) tbody.appendChild(el("tr", { class: "empty-row" }, el("td", { colspan: "9" }, "ไม่พบข้อมูล")));
    table.appendChild(tbody);
    wrap.appendChild(table);
  }
  renderTable();
}

function openEmployeeForm(empId) {
  const existing = empId ? getEmployee(empId) : null;
  openModal(
    existing ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่",
    "",
    [
      { name: "id", label: "รหัสพนักงาน", value: existing ? existing.id : nextEmployeeId(), readonly: !!existing },
      { name: "hn", label: "HN", value: existing ? existing.hn : "" },
      { name: "name", label: "คำนำหน้า-ชื่อ-นามสกุล", value: existing ? existing.name : "" },
      { name: "division", label: "ส่วนงาน/แผนก", value: existing ? existing.division : "" },
      { name: "position", label: "ตำแหน่ง", value: existing ? existing.position : "" },
      { name: "riskGroup", label: "กลุ่มความเสี่ยง", type: "select", value: existing ? existing.riskGroup : "1.1", options: RISK_GROUPS.map((g) => ({ value: g, text: g })) },
      { name: "status", label: "สถานะพนักงาน", type: "select", value: existing ? existing.status : "Active", options: [{ value: "Active", text: "Active" }, { value: "Inactive", text: "Inactive" }] },
    ],
    (v) => {
      if (!v.hn || !v.name) return "กรุณากรอก HN และชื่อ-นามสกุล";
      const today = new Date().toISOString().slice(0, 10);
      if (existing) {
        Object.assign(existing, { hn: v.hn, name: v.name, division: v.division, position: v.position, riskGroup: v.riskGroup, status: v.status, updatedAt: today });
      } else {
        DATA.employees.push({ id: v.id, hn: v.hn, name: v.name, division: v.division, position: v.position, riskGroup: v.riskGroup, status: v.status, updatedAt: today });
      }
      persist();
      render();
      showToast(existing ? "แก้ไขข้อมูลพนักงานแล้ว" : "เพิ่มพนักงานใหม่แล้ว");
    }
  );
}
function deleteEmployee(id) {
  if (!confirm("ลบพนักงานคนนี้ออกจากระบบ? (ข้อมูลวัคซีน/ผลตรวจของคนนี้จะยังอยู่ในระบบ)")) return;
  DATA.employees = DATA.employees.filter((e) => e.id !== id);
  persist();
  render();
  showToast("ลบข้อมูลพนักงานแล้ว");
}

// ---------------------------------------------------------------------------
// Page: Vaccine log (per vaccine key)
// ---------------------------------------------------------------------------
function pageVaccine(container, key) {
  const meta = VACCINE_META[key];
  const card = el("div", { class: "card section-card" });
  card.appendChild(el("h3", {}, "ข้อมูลการฉีดวัคซีน: " + meta.label));
  card.appendChild(el("div", { class: "hint" }, `1 แถว = การฉีด 1 ครั้ง | เกณฑ์ครบ = ${meta.requiredNote} | อ้างอิงรหัสยาจากหน้า "รหัสอ้างอิง"`));

  const toolbar = el("div", { class: "toolbar" });
  const skey = "vaccine:" + key;
  const search = el("input", {
    class: "search-box", placeholder: "ค้นหาชื่อ / รหัสพนักงาน...",
    value: searchTerms[skey] || "",
    oninput: (e) => { searchTerms[skey] = e.target.value; renderTable(); },
  });
  toolbar.appendChild(search);
  toolbar.appendChild(el("div", { class: "spacer" }));
  toolbar.appendChild(el("button", { class: "btn " + (meta.color === "teal" ? "btn-teal" : "btn-primary"), onclick: () => openVaccineForm(key, null) }, "+ เพิ่มการฉีด"));
  card.appendChild(toolbar);

  const wrap = el("div", { class: "table-wrap" });
  card.appendChild(wrap);
  container.appendChild(card);

  function renderTable() {
    wrap.innerHTML = "";
    const table = el("table");
    const thead = el("tr");
    ["รหัสพนักงาน", "ชื่อ-นามสกุล", "ส่วนงาน", "วันที่ฉีด", "ยี่ห้อ", "รหัสยา (HIS)", "ลำดับเข็ม", "Lot No.", "หมายเหตุ", ""].forEach((h) =>
      thead.appendChild(el("th", {}, h))
    );
    table.appendChild(el("thead", {}, thead));
    const tbody = el("tbody");
    const term = (searchTerms[skey] || "").toLowerCase();
    let records = (DATA.vaccineRecords[key] || []).filter(
      (r) => !term || empName(r.empId).toLowerCase().includes(term) || r.empId.toLowerCase().includes(term)
    );
    records = records.slice().sort((a, b) => (a.empId + a.date).localeCompare(b.empId + b.date));
    records.forEach((r) => {
      const seq = doseSeq(key, r.empId, r.date, null);
      const tr = el("tr", {}, [
        el("td", {}, r.empId),
        el("td", {}, empName(r.empId)),
        el("td", {}, empDivision(r.empId)),
        el("td", {}, fmtDate(r.date)),
        el("td", {}, r.brand),
        el("td", {}, r.code),
        el("td", { class: "center" }, el("span", { class: "badge badge-" + meta.color }, String(seq))),
        el("td", {}, r.lot || "-"),
        el("td", {}, r.note || ""),
        el("td", {}, [
          el("button", { class: "btn-edit-text", onclick: () => openVaccineForm(key, r.id) }, "แก้ไข"),
          el("button", { class: "btn-danger-text", onclick: () => deleteVaccineRecord(key, r.id) }, "ลบ"),
        ]),
      ]);
      tbody.appendChild(tr);
    });
    if (!records.length) tbody.appendChild(el("tr", { class: "empty-row" }, el("td", { colspan: "10" }, "ยังไม่มีข้อมูลการฉีด")));
    table.appendChild(tbody);
    wrap.appendChild(table);
  }
  renderTable();
}

function openVaccineForm(key, recId) {
  const meta = VACCINE_META[key];
  const existing = recId ? DATA.vaccineRecords[key].find((r) => r.id === recId) : null;
  if (!DATA.employees.length) { showToast("กรุณาเพิ่มข้อมูลพนักงานก่อน"); return; }
  openModal(
    existing ? "แก้ไขข้อมูลการฉีด: " + meta.label : "เพิ่มข้อมูลการฉีด: " + meta.label,
    "",
    [
      {
        name: "empId", label: "พนักงาน", type: "select", value: existing ? existing.empId : DATA.employees[0].id,
        options: DATA.employees.map((e) => ({ value: e.id, text: `${e.id} — ${e.name}` })),
      },
      { name: "date", label: "วันที่ฉีด", type: "date", value: existing ? existing.date : "" },
      {
        name: "brand", label: "ยี่ห้อวัคซีน", type: "select", value: existing ? existing.brand : meta.brands[0].name,
        options: meta.brands.map((b) => ({ value: b.name, text: b.name })),
      },
      { name: "lot", label: "Lot No. (ถ้ามี)", value: existing ? existing.lot : "" },
      { name: "note", label: "หมายเหตุ", type: "textarea", value: existing ? existing.note : "" },
    ],
    (v) => {
      if (!v.date) return "กรุณาระบุวันที่ฉีด";
      const brandObj = meta.brands.find((b) => b.name === v.brand) || meta.brands[0];
      if (existing) {
        Object.assign(existing, { empId: v.empId, date: v.date, brand: v.brand, code: brandObj.code, lot: v.lot, note: v.note });
      } else {
        DATA.vaccineRecords[key].push({ id: rid(), empId: v.empId, date: v.date, brand: v.brand, code: brandObj.code, lot: v.lot, note: v.note });
      }
      persist();
      render();
      showToast(existing ? "แก้ไขข้อมูลการฉีดแล้ว" : "เพิ่มข้อมูลการฉีดแล้ว");
    }
  );
}
function deleteVaccineRecord(key, id) {
  if (!confirm("ลบรายการฉีดนี้?")) return;
  DATA.vaccineRecords[key] = DATA.vaccineRecords[key].filter((r) => r.id !== id);
  persist();
  render();
  showToast("ลบรายการแล้ว");
}

// ---------------------------------------------------------------------------
// Page: Lab results
// ---------------------------------------------------------------------------
function pageLab(container) {
  const card = el("div", { class: "card section-card" });
  card.appendChild(el("h3", {}, "ผลตรวจภูมิคุ้มกัน (Lab / Immunity Results)"));
  card.appendChild(el("div", { class: "hint" }, "1 แถว = การตรวจ 1 ครั้ง | ผลตรวจแสดงเป็น Positive / Negative | อ้างอิงรหัส Lab จากหน้า \"รหัสอ้างอิง\""));

  const toolbar = el("div", { class: "toolbar" });
  const search = el("input", {
    class: "search-box", placeholder: "ค้นหาชื่อ / รหัสพนักงาน...",
    value: searchTerms.lab || "",
    oninput: (e) => { searchTerms.lab = e.target.value; renderTable(); },
  });
  toolbar.appendChild(search);
  toolbar.appendChild(el("div", { class: "spacer" }));
  toolbar.appendChild(el("button", { class: "btn btn-teal", onclick: () => openLabForm(null) }, "+ เพิ่มผลตรวจ"));
  card.appendChild(toolbar);

  const wrap = el("div", { class: "table-wrap" });
  card.appendChild(wrap);
  container.appendChild(card);

  function renderTable() {
    wrap.innerHTML = "";
    const table = el("table");
    const thead = el("tr");
    ["รหัสพนักงาน", "ชื่อ-นามสกุล", "ส่วนงาน", "วันที่ตรวจ", "ชื่อการตรวจ", "รหัส Lab", "ผลตรวจ", "หมายเหตุ", ""].forEach((h) =>
      thead.appendChild(el("th", {}, h))
    );
    table.appendChild(el("thead", {}, thead));
    const tbody = el("tbody");
    const term = (searchTerms.lab || "").toLowerCase();
    let records = DATA.labRecords.filter(
      (r) => !term || empName(r.empId).toLowerCase().includes(term) || r.empId.toLowerCase().includes(term)
    );
    records = records.slice().sort((a, b) => (a.empId + a.date).localeCompare(b.empId + b.date));
    records.forEach((r) => {
      const tr = el("tr", {}, [
        el("td", {}, r.empId),
        el("td", {}, empName(r.empId)),
        el("td", {}, empDivision(r.empId)),
        el("td", {}, fmtDate(r.date)),
        el("td", {}, r.test),
        el("td", {}, r.code),
        el("td", { class: "center" }, el("span", { class: "badge badge-" + (r.result === "Positive" ? "good" : "bad") }, r.result)),
        el("td", {}, r.note || ""),
        el("td", {}, [
          el("button", { class: "btn-edit-text", onclick: () => openLabForm(r.id) }, "แก้ไข"),
          el("button", { class: "btn-danger-text", onclick: () => deleteLabRecord(r.id) }, "ลบ"),
        ]),
      ]);
      tbody.appendChild(tr);
    });
    if (!records.length) tbody.appendChild(el("tr", { class: "empty-row" }, el("td", { colspan: "9" }, "ยังไม่มีข้อมูลผลตรวจ")));
    table.appendChild(tbody);
    wrap.appendChild(table);
  }
  renderTable();
}

function openLabForm(recId) {
  const existing = recId ? DATA.labRecords.find((r) => r.id === recId) : null;
  if (!DATA.employees.length) { showToast("กรุณาเพิ่มข้อมูลพนักงานก่อน"); return; }
  openModal(
    existing ? "แก้ไขผลตรวจภูมิคุ้มกัน" : "เพิ่มผลตรวจภูมิคุ้มกัน",
    "",
    [
      {
        name: "empId", label: "พนักงาน", type: "select", value: existing ? existing.empId : DATA.employees[0].id,
        options: DATA.employees.map((e) => ({ value: e.id, text: `${e.id} — ${e.name}` })),
      },
      { name: "date", label: "วันที่ตรวจ", type: "date", value: existing ? existing.date : "" },
      {
        name: "test", label: "ชื่อการตรวจ", type: "select", value: existing ? existing.test : LAB_META[0].test,
        options: LAB_META.map((l) => ({ value: l.test, text: l.test })),
      },
      {
        name: "result", label: "ผลตรวจ", type: "select", value: existing ? existing.result : "Positive",
        options: [{ value: "Positive", text: "Positive" }, { value: "Negative", text: "Negative" }],
      },
      { name: "note", label: "หมายเหตุ", type: "textarea", value: existing ? existing.note : "" },
    ],
    (v) => {
      if (!v.date) return "กรุณาระบุวันที่ตรวจ";
      const labObj = LAB_META.find((l) => l.test === v.test);
      if (existing) {
        Object.assign(existing, { empId: v.empId, date: v.date, test: v.test, code: labObj.code, result: v.result, note: v.note });
      } else {
        DATA.labRecords.push({ id: rid(), empId: v.empId, date: v.date, test: v.test, code: labObj.code, result: v.result, note: v.note });
      }
      persist();
      render();
      showToast(existing ? "แก้ไขผลตรวจแล้ว" : "เพิ่มผลตรวจแล้ว");
    }
  );
}
function deleteLabRecord(id) {
  if (!confirm("ลบผลตรวจนี้?")) return;
  DATA.labRecords = DATA.labRecords.filter((r) => r.id !== id);
  persist();
  render();
  showToast("ลบรายการแล้ว");
}

// ---------------------------------------------------------------------------
// Page: Code reference (read-only)
// ---------------------------------------------------------------------------
function pageCodes(container) {
  const card1 = el("div", { class: "card section-card" });
  card1.appendChild(el("h3", {}, "ก) รหัสยาวัคซีน (HIS)"));
  card1.appendChild(el("div", { class: "hint" }, "เฉพาะวัคซีนกลุ่มหลักที่ใช้ในโครงการบุคลากรทางการแพทย์ — คัดจากไฟล์ Code วัคซีนและแลป.xlsx ที่ให้มา"));
  const wrap1 = el("div", { class: "table-wrap" });
  const t1 = el("table");
  t1.appendChild(el("thead", {}, el("tr", {}, ["ชื่อวัคซีน (กลุ่ม)", "ยี่ห้อ", "รหัสยา (HIS)"].map((h) => el("th", {}, h)))));
  const b1 = el("tbody");
  Object.entries(VACCINE_META).forEach(([key, meta]) => {
    meta.brands.forEach((b, i) => {
      b1.appendChild(el("tr", {}, [el("td", {}, i === 0 ? meta.label : ""), el("td", {}, b.name), el("td", {}, b.code)]));
    });
  });
  t1.appendChild(b1);
  wrap1.appendChild(t1);
  card1.appendChild(wrap1);
  container.appendChild(card1);

  const card2 = el("div", { class: "card section-card" });
  card2.appendChild(el("h3", {}, "ข) รหัสตรวจภูมิคุ้มกัน (LIS)"));
  const wrap2 = el("div", { class: "table-wrap" });
  const t2 = el("table");
  t2.appendChild(el("thead", {}, el("tr", {}, ["ชื่อการตรวจ (Test)", "รหัส Lab (LIS)", "เกี่ยวข้องกับวัคซีน"].map((h) => el("th", {}, h)))));
  const b2 = el("tbody");
  LAB_META.forEach((l) => b2.appendChild(el("tr", {}, [el("td", {}, l.test), el("td", {}, l.code), el("td", {}, l.related)])));
  t2.appendChild(b2);
  wrap2.appendChild(t2);
  card2.appendChild(wrap2);
  card2.appendChild(el("div", { class: "code-note" }, "หมายเหตุ: รายการ HBsAg / Anti-HBs พบรหัสมากกว่า 1 ชุดในไฟล์ที่ให้มา (อาจมาจากคนละระบบ เช่น LIS กับเครื่องตรวจ POCT) โปรดยืนยันกับฝ่าย LIS ว่ารหัสใดใช้งานจริงก่อนเชื่อมต่อข้อมูล"));
  container.appendChild(card2);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const TITLES = {
  overview: ["ภาพรวม", "สรุปสถานะวัคซีนและภูมิคุ้มกันของบุคลากรทั้งหมด"],
  employees: ["ข้อมูลพนักงาน", "ทะเบียนบุคลากรหลัก (Master data)"],
  lab: ["ผลตรวจภูมิคุ้มกัน", "บันทึกผลตรวจภูมิคุ้มกันรายครั้ง"],
  codes: ["รหัสอ้างอิง HIS / LIS", "รหัสยาและรหัส Lab สำหรับให้ทีมไอทีใช้ดึงข้อมูล"],
};

function render() {
  renderNav();
  const content = document.getElementById("content");
  content.innerHTML = "";

  let title = "", sub = "";
  if (ROUTE.startsWith("vaccine:")) {
    const key = ROUTE.split(":")[1];
    title = "วัคซีน: " + VACCINE_META[key].label;
    sub = "ข้อมูลดิบรายครั้งที่ฉีด (transaction log)";
    pageVaccine(content, key);
  } else if (ROUTE === "overview") {
    [title, sub] = TITLES.overview; pageOverview(content);
  } else if (ROUTE === "employees") {
    [title, sub] = TITLES.employees; pageEmployees(content);
  } else if (ROUTE === "lab") {
    [title, sub] = TITLES.lab; pageLab(content);
  } else if (ROUTE === "codes") {
    [title, sub] = TITLES.codes; pageCodes(content);
  }
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pageSub").textContent = sub;
}

document.getElementById("resetDataBtn").addEventListener("click", () => {
  if (!confirm("รีเซ็ตข้อมูลทั้งหมดกลับเป็นข้อมูลตัวอย่างเริ่มต้น? การเปลี่ยนแปลงที่ทำไว้จะหายไป")) return;
  DATA = seedData();
  persist();
  render();
  showToast("รีเซ็ตข้อมูลตัวอย่างแล้ว");
});

render();

// ---------------------------------------------
// Ambient starfield
// ---------------------------------------------
(function buildStars() {
  const container = document.getElementById("stars");
  const count = 60;
  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
    container.appendChild(star);
  }
})();

// ---------------------------------------------
// Age calculation
// ---------------------------------------------
const form = document.getElementById("ageForm");
const birthInput = document.getElementById("birthdate");
const atInput = document.getElementById("attime");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");

const els = {
  years: document.getElementById("ageYears"),
  fine: document.getElementById("ageFine"),
  months: document.getElementById("statMonths"),
  weeks: document.getElementById("statWeeks"),
  days: document.getElementById("statDays"),
  hours: document.getElementById("statHours"),
  minutes: document.getElementById("statMinutes"),
  next: document.getElementById("statNext"),
  born: document.getElementById("bornOn"),
  orbitFill: document.getElementById("orbitFill"),
  orbitMarker: document.getElementById("orbitMarker"),
  orbitCaption: document.getElementById("orbitCaption"),
};

// default "as of" field to today, capped as max on both fields
const today = new Date();
const todayStr = toDateInputValue(today);
atInput.value = todayStr;
atInput.max = todayStr;
birthInput.max = todayStr;

function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(value) {
  // value: "YYYY-MM-DD" -> local midnight Date, avoids UTC offset bugs
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  resultEl.hidden = true;
}

function clearError() {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearError();

  if (!birthInput.value) {
    showError("Please enter a date of birth.");
    return;
  }

  const birth = parseLocalDate(birthInput.value);
  const asOf = atInput.value ? parseLocalDate(atInput.value) : new Date();

  if (birth > asOf) {
    showError("That birth date is after the 'as of' date — check the years.");
    return;
  }

  render(birth, asOf);
});

function render(birth, asOf) {
  // Calendar-accurate years / months / days
  let years = asOf.getFullYear() - birth.getFullYear();
  let months = asOf.getMonth() - birth.getMonth();
  let days = asOf.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Raw totals (based on elapsed milliseconds)
  const msDiff = asOf.getTime() - birth.getTime();
  const totalDays = Math.floor(msDiff / 86400000);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;
  const totalHours = Math.floor(msDiff / 3600000);
  const totalMinutes = Math.floor(msDiff / 60000);

  // Next birthday
  let nextBirthday = new Date(asOf.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < asOf) {
    nextBirthday = new Date(asOf.getFullYear() + 1, birth.getMonth(), birth.getDate());
  } else if (sameDay(nextBirthday, asOf)) {
    nextBirthday = new Date(asOf.getFullYear(), birth.getMonth(), birth.getDate());
  }

  const daysToNext = Math.ceil((nextBirthday.getTime() - asOf.getTime()) / 86400000);

  // Progress through current year-lap (last birthday -> next birthday)
  let lastBirthday = new Date(asOf.getFullYear(), birth.getMonth(), birth.getDate());
  if (lastBirthday > asOf) {
    lastBirthday = new Date(asOf.getFullYear() - 1, birth.getMonth(), birth.getDate());
  }
  const lapLength = nextBirthday.getTime() - lastBirthday.getTime();
  const lapElapsed = asOf.getTime() - lastBirthday.getTime();
  const pct = lapLength > 0 ? Math.min(100, Math.max(0, (lapElapsed / lapLength) * 100)) : 0;

  // ---- paint ----
  els.years.textContent = years.toLocaleString();
  els.fine.textContent = `${months} month${months === 1 ? "" : "s"}, ${days} day${days === 1 ? "" : "s"}`;

  els.months.textContent = totalMonths.toLocaleString();
  els.weeks.textContent = totalWeeks.toLocaleString();
  els.days.textContent = totalDays.toLocaleString();
  els.hours.textContent = totalHours.toLocaleString();
  els.minutes.textContent = totalMinutes.toLocaleString();
  els.next.textContent = daysToNext === 0 ? "Today 🎉" : `${daysToNext} day${daysToNext === 1 ? "" : "s"}`;

  els.born.textContent = `Born ${birth.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}, measured as of ${asOf.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.`;

  els.orbitFill.style.width = `calc(${pct}% - 8px)`;
  els.orbitMarker.style.left = `calc(${pct}% )`;
  els.orbitCaption.textContent = `${pct.toFixed(1)}% of the way around this orbit — next birthday in ${daysToNext} day${daysToNext === 1 ? "" : "s"}`;

  resultEl.hidden = false;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

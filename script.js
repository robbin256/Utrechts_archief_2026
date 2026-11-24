const video = document.getElementById("historyVideo");
const playPause = document.getElementById("playPause");
const centerPlay = document.getElementById("centerPlay");
const jumpBack = document.getElementById("jumpBack");
const jumpForward = document.getElementById("jumpForward");
const slider = document.getElementById("timelineSlider");
const currentTime = document.getElementById("currentTime");
const durationText = document.getElementById("duration");
const boatPosition = document.getElementById("boatPosition");
const soundButton = document.getElementById("soundButton");
const locationCard = document.getElementById("locationCard");
const sourceSheet = document.getElementById("sourceSheet");

const locations = [
  { title: "Gaardbrug", type: "Startpunt", time: 0, position: [153, 422], description: "Vanaf deze brug begint de historische vaartocht. In de film zie je hoe de stad zich langs de gracht ontvouwt.", source: "Filmopname 1929" },
  { title: "Stadhuisbrug", type: "Herkenbaar punt", time: 0.18, position: [122, 340], description: "Bij de brug liggen gebouwen die al generaties deel uitmaken van het stadsbeeld. Bekijk ze in beweging op het scherm.", source: "Filmopname 1929" },
  { title: "Bakkerbrug", type: "Langs de gracht", time: 0.36, position: [94, 278], description: "Deze plek laat de smalle werf, bruggen en bebouwing aan de Oudegracht naast elkaar zien.", source: "Filmopname 1929" },
  { title: "Maartensbrug", type: "Historisch centrum", time: 0.54, position: [120, 196], description: "Langs dit deel van de gracht ligt het hart van Utrecht. Veel gebouwen en gevels hebben eeuwen meegemaakt.", source: "Filmopname 1929" },
  { title: "Viebrug", type: "Bij de werven", time: 0.72, position: [123, 112], description: "Hier zie je hoe hoogteverschillen, trappen en bruggen samen de karakteristieke werven vormen.", source: "Filmopname 1929" },
  { title: "Bezembrug", type: "Eindpunt", time: 0.92, position: [92, 74], description: "Bij de Bezembrug eindigt het traject van de film. De route gaat hier terug naar het noorden van de stad.", source: "Filmopname 1929" }
];

let activeIndex = -1;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function setLocation(index, seek = false) {
  if (index < 0 || index >= locations.length) return;
  activeIndex = index;
  const location = locations[index];

  document.querySelectorAll(".marker-group").forEach((marker, markerIndex) => {
    marker.classList.toggle("active", markerIndex === index);
  });

  document.getElementById("locationNumber").textContent = String(index + 1).padStart(2, "0");
  document.getElementById("locationType").textContent = location.type;
  document.getElementById("locationTitle").textContent = location.title;
  document.getElementById("locationDescription").textContent = location.description;
  document.getElementById("sheetTitle").textContent = location.title;
  document.getElementById("sheetDescription").textContent = `${location.description} Meer historische bronnen worden nog aangevuld.`;
  document.getElementById("sheetSource").textContent = location.source;
  document.getElementById("sheetTime").textContent = formatTime(location.time * (video.duration || 0));

  if (seek && video.duration) {
    video.currentTime = location.time * video.duration;
    if (video.paused) video.play().catch(() => {});
  }
}

function locationFromProgress(progress) {
  let index = 0;
  for (let i = 0; i < locations.length; i++) {
    if (progress >= locations[i].time) index = i;
  }
  return index;
}

function updateProgress() {
  const progress = video.duration ? video.currentTime / video.duration : 0;
  slider.value = Math.round(progress * 1000);
  slider.style.setProperty("--progress", `${progress * 100}`);
  currentTime.textContent = formatTime(video.currentTime);

  const index = locationFromProgress(progress);
  if (index !== activeIndex) setLocation(index);

  const from = locations[index];
  const to = locations[Math.min(index + 1, locations.length - 1)];
  const segmentStart = from.time;
  const segmentEnd = to.time;
  const segmentProgress = segmentEnd === segmentStart ? 1 : (progress - segmentStart) / (segmentEnd - segmentStart);
  const clamped = Math.max(0, Math.min(1, segmentProgress));
  const x = from.position[0] + (to.position[0] - from.position[0]) * clamped;
  const y = from.position[1] + (to.position[1] - from.position[1]) * clamped;
  boatPosition.setAttribute("transform", `translate(${x} ${y})`);
}

function togglePlayback() {
  if (video.paused) {
    video.play().catch(() => {});
  } else {
    video.pause();
  }
}

video.addEventListener("loadedmetadata", () => {
  durationText.textContent = formatTime(video.duration);
  setLocation(0);
  updateProgress();
});

video.addEventListener("timeupdate", updateProgress);
video.addEventListener("play", () => {
  playPause.classList.add("playing");
  playPause.setAttribute("aria-label", "Pauzeren");
  centerPlay.classList.add("hidden");
});
video.addEventListener("pause", () => {
  playPause.classList.remove("playing");
  playPause.setAttribute("aria-label", "Afspelen");
  if (video.currentTime === 0) centerPlay.classList.remove("hidden");
});
video.addEventListener("ended", () => {
  centerPlay.classList.remove("hidden");
  playPause.classList.remove("playing");
});

playPause.addEventListener("click", togglePlayback);
centerPlay.addEventListener("click", togglePlayback);
jumpBack.addEventListener("click", () => { video.currentTime = Math.max(0, video.currentTime - 10); });
jumpForward.addEventListener("click", () => { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); });

slider.addEventListener("input", () => {
  if (video.duration) video.currentTime = (Number(slider.value) / 1000) * video.duration;
});

document.querySelectorAll(".marker-group").forEach(marker => {
  const activate = () => setLocation(Number(marker.dataset.index), true);
  marker.addEventListener("click", activate);
  marker.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
});

soundButton.addEventListener("click", () => {
  video.muted = !video.muted;
  soundButton.classList.toggle("muted", video.muted);
  soundButton.setAttribute("aria-label", video.muted ? "Geluid aanzetten" : "Geluid uitzetten");
  soundButton.querySelector("span").textContent = video.muted ? "Geluid uit" : "Geluid aan";
});

function openSheet() {
  sourceSheet.classList.add("open");
  sourceSheet.setAttribute("aria-hidden", "false");
  document.getElementById("sheetClose").focus();
}
function closeSheet() {
  sourceSheet.classList.remove("open");
  sourceSheet.setAttribute("aria-hidden", "true");
  document.getElementById("sourceButton").focus();
}
document.getElementById("sourceButton").addEventListener("click", openSheet);
document.getElementById("sheetClose").addEventListener("click", closeSheet);
document.getElementById("sheetBackdrop").addEventListener("click", closeSheet);
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && sourceSheet.classList.contains("open")) closeSheet();
});

video.muted = true;

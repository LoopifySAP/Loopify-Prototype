(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const STATE_KEY = "loopifyPrototypeState";
  const PROFILE_KEY = "loopifyProfile";
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  const defaults = {
    date: todayKey(),
    screenMinutes: 0,
    targetHours: 5,
    points: 70,
    completed: [],
    streak: 0,
    posts: []
  };

  let state = { ...defaults };
  let profile = {
    username: "Naya",
    gender: "female",
    goal: "focus",
    photo: ""
  };

  try {
    state = { ...defaults, ...JSON.parse(localStorage.getItem(STATE_KEY) || "{}") };
  } catch {}

  try {
    profile = { ...profile, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
  } catch {}

  // Reset data harian saat tanggal lokal berganti.
  function resetDailyIfNeeded() {
    if (state.date === todayKey()) return;

    state.date = todayKey();
    state.screenMinutes = 0;
    state.completed = state.completed.filter(item => item.startsWith("reward-"));
    save();
  }

  function save() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      toast("Penyimpanan penuh. Coba gunakan foto profil yang lebih kecil.");
    }
  }

  function saveProfile() {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      toast("Profil belum dapat disimpan. Coba foto yang lebih kecil.");
    }
  }

  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function formatTime(minutes) {
    return `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Morning";
    if (h >= 12 && h < 15) return "Afternoon";
    if (h >= 15 && h < 18) return "Evening";
    return "Night";
  }

  function renderDate() {
    $("greetingTime").textContent = greeting();
    $("currentDate").textContent =
      new Intl.DateTimeFormat("en-GB", {
        weekday: "long", day: "numeric", month: "long"
      }).format(new Date()) + " · one small step at a time.";
  }

  function avatar(gender) {
    const hair = gender === "female" ? "#49372e" : "#302c27";
    const hairShape = gender === "female"
      ? `<path d="M17 39C12 20 16 7 32 6 49 5 53 20 47 40l-7-3V22c-7 3-14 1-20-3v20z" fill="${hair}"/>`
      : `<path d="M17 25C15 12 24 6 34 6c10 0 16 7 15 18l-7-4c-7 2-13 1-19-2z" fill="${hair}"/>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="32" fill="#315a43"/>
      <path d="M7 64c2-14 12-21 25-21s23 7 25 21" fill="#86a887"/>
      ${hairShape}
      <ellipse cx="32" cy="28" rx="13" ry="16" fill="#d9a77e"/>
      <circle cx="27" cy="29" r="1.3" fill="#352c25"/><circle cx="37" cy="29" r="1.3" fill="#352c25"/>
      <path d="M28 36q4 4 8 0" fill="none" stroke="#8d5544" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function profileImage() {
    return profile.photo || avatar(profile.gender);
  }

  function renderProfile() {
    profile.username = (profile.username || "Naya").trim().slice(0, 10) || "Naya";
    $("overviewUsername").textContent = profile.username + ".";
    $("profileAvatar").src = profileImage();
    $("profilePreview").src = profileImage();
    $("profilePreviewName").textContent = profile.username;
    $("usernameInput").value = profile.username;
    $("genderInput").value = profile.gender;
    $("profileGoal").value = profile.goal;
  }

  function renderWeek(id) {
    const el = $(id);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = (new Date().getDay() + 6) % 7;
    el.replaceChildren();

    days.forEach((day, i) => {
      const wrap = document.createElement("div");
      wrap.className = "week-day";
      const label = document.createElement("span");
      label.textContent = day;
      const dot = document.createElement("div");
      const done = i < Math.min(state.streak, 7);
      dot.className = "week-dot" + (done ? " done" : "") + (i === today ? " today" : "");
      dot.textContent = done ? "✓" : "·";
      wrap.append(label, dot);
      el.append(wrap);
    });
  }

  function render() {
    resetDailyIfNeeded();
    const time = formatTime(state.screenMinutes);
    const percentage = Math.round(state.screenMinutes / Math.max(1, state.targetHours * 60) * 100);
    const challengeKeys = ["break", "walk", "plant"];
    const completedCount = state.completed.filter(k => challengeKeys.includes(k)).length;

    $("screenTimeValue").textContent = time;
    $("trackerTime").textContent = time;
    $("screenTargetLabel").textContent = state.targetHours + "j";
    $("screenProgressBar").style.width = Math.min(100, percentage) + "%";
    $("screenPercent").textContent = percentage + "% dari target";

    ["pointsValue", "progressPoints", "rewardsPoints"].forEach(id => $(id).textContent = state.points);
    $("challengeDone").textContent = completedCount;
    $("progressChallenges").textContent = completedCount;
    $("streakValue").textContent = state.streak + "-day streak";
    $("progressStreak").textContent = state.streak + " days";
    $("screenHours").value = Math.floor(state.screenMinutes / 60);
    $("screenMinutes").value = state.screenMinutes % 60;
    $("screenTarget").value = String(state.targetHours);

    renderWeek("weekGrid");
    renderWeek("progressWeekGrid");

    document.querySelectorAll(".challenge-complete").forEach(button => {
      const done = state.completed.includes(button.dataset.key);
      button.disabled = done;
      button.textContent = done ? "Completed ✓" : `Selesaikan · +${button.dataset.points} poin`;
    });

    document.querySelectorAll(".reward-claim").forEach(button => {
      const claimed = state.completed.includes("reward-" + button.dataset.reward);
      button.disabled = claimed;
      button.textContent = claimed ? "Claimed ✓" :
        button.dataset.cost === "0" ? "Klaim lencana" : "Klaim reward";
    });
  }

  function go(view) {
    document.querySelectorAll(".view").forEach(section =>
      section.classList.toggle("active", section.dataset.page === view)
    );
    document.querySelectorAll(".nav-item").forEach(button =>
      button.classList.toggle("active", button.dataset.view === view)
    );
    $("sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".nav-item").forEach(button =>
    button.addEventListener("click", () => go(button.dataset.view))
  );
  document.querySelectorAll("[data-go]").forEach(button =>
    button.addEventListener("click", () => go(button.dataset.go))
  );

  // Navigasi mobile: sidebar dapat dibuka dengan tombol menu.
  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "mobile-menu";
  menuButton.textContent = "☰";
  menuButton.setAttribute("aria-label", "Buka menu navigasi");
  $("sidebar").prepend(menuButton);
  menuButton.addEventListener("click", () => $("sidebar").classList.toggle("open"));

  // Modal profil.
  const modal = $("profileModal");
  function openModal() {
    renderProfile();
    $("profileMessage").textContent = "";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    $("usernameInput").focus();
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    $("profileButton").focus();
  }

  $("profileButton").addEventListener("click", openModal);
  $("closeProfile").addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  $("usernameInput").addEventListener("input", () => {
    $("usernameInput").value = $("usernameInput").value.slice(0, 10);
    $("profilePreviewName").textContent = $("usernameInput").value || "Naya";
  });

  $("genderInput").addEventListener("change", () => {
    if (!profile.photo) $("profilePreview").src = avatar($("genderInput").value);
  });

  // Resize gambar sebelum menyimpan agar ukuran lebih ringan.
  $("profilePhoto").addEventListener("change", event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Pilih file gambar yang valid.");
      event.target.value = "";
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast("Ukuran foto maksimal 12 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 420;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        profile.photo = canvas.toDataURL("image/jpeg", 0.78);
        $("profilePreview").src = profile.photo;
        $("profileMessage").textContent = "Foto siap digunakan. Tekan Save profile untuk menyimpan.";
      };
      image.onerror = () => toast("Foto tidak dapat dibaca. Coba gambar lain.");
      image.src = reader.result;
    };
    reader.onerror = () => toast("Gagal membaca foto.");
    reader.readAsDataURL(file);
  });

  $("resetPhoto").addEventListener("click", () => {
    profile.photo = "";
    $("profilePhoto").value = "";
    $("profilePreview").src = avatar($("genderInput").value);
    $("profileMessage").textContent = "Avatar ilustrasi dipilih. Tekan Save profile untuk menyimpan.";
  });

  $("profileForm").addEventListener("submit", event => {
    event.preventDefault();
    const username = $("usernameInput").value.trim().slice(0, 10);
    if (!username) {
      $("profileMessage").textContent = "Username tidak boleh kosong.";
      return;
    }
    profile = {
      ...profile,
      username,
      gender: $("genderInput").value,
      goal: $("profileGoal").value
    };
    saveProfile();
    renderProfile();
    $("profileMessage").textContent = "Profil berhasil disimpan.";
    toast("Profil berhasil disimpan.");
    setTimeout(closeModal, 400);
  });

  // Simpan screen time manual.
  $("saveScreenTime").addEventListener("click", () => {
    const hours = Number($("screenHours").value);
    const minutes = Number($("screenMinutes").value);
    const target = Number($("screenTarget").value);
    if (!Number.isInteger(hours) || hours < 0 || hours > 23 ||
        !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
      $("trackerMessage").textContent = "Masukkan jam 0–23 dan menit 0–59.";
      return;
    }
    state.screenMinutes = hours * 60 + minutes;
    state.targetHours = target;
    save();
    render();
    $("trackerMessage").textContent = "Screen time berhasil diperbarui.";
    toast("Screen time updated.");
  });

  // Tantangan hanya dapat diklaim sekali per hari.
  document.querySelectorAll(".challenge-complete").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.key;
      if (state.completed.includes(key)) return;
      state.completed.push(key);
      state.points += Number(button.dataset.points);
      state.streak = Math.max(1, state.streak);
      save();
      render();
      $("challengeMessage").textContent = "Tantangan selesai dan Eco-Points ditambahkan.";
      toast("Challenge completed!");
    });
  });

  // Community: contoh posts bersifat read-only; post pengguna memiliki tombol hapus.
  const samplePosts = [
    { id: "sample-rani", username: "Rani", message: "Hari ini mencoba makan siang tanpa scroll. Rasanya lebih hadir.", own: false },
    { id: "sample-arga", username: "Arga", message: "Mulai dari jeda 10 menit dulu. Small steps count!", own: false }
  ];

  function renderPosts() {
    const feed = $("communityFeed");
    feed.replaceChildren();
    const posts = [...(state.posts || []), ...samplePosts];

    if (!posts.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Belum ada catatan komunitas.";
      feed.append(empty);
      return;
    }

    posts.forEach(post => {
      const item = document.createElement("article");
      item.className = "feed-item";

      const head = document.createElement("div");
      head.className = "feed-head";
      const name = document.createElement("strong");
      name.textContent = post.username;
      head.append(name);

      if (post.own) {
        const del = document.createElement("button");
        del.type = "button";
        del.className = "delete-post";
        del.textContent = "Hapus";
        del.setAttribute("aria-label", "Hapus catatan milik " + post.username);
        del.addEventListener("click", () => {
          state.posts = state.posts.filter(p => p.id !== post.id);
          save();
          renderPosts();
          $("communityMessage").textContent = "Catatanmu telah dihapus.";
          toast("Catatan dihapus.");
        });
        head.append(del);
      } else {
        const tag = document.createElement("span");
        tag.className = "sample-tag";
        tag.textContent = "Contoh";
        head.append(tag);
      }

      const text = document.createElement("p");
      text.textContent = post.message;
      item.append(head, text);
      feed.append(item);
    });
  }

  $("sharePost").addEventListener("click", () => {
    const input = $("communityPost");
    const message = input.value.trim();
    if (!message) {
      $("communityMessage").textContent = "Tulis satu langkah kecilmu terlebih dahulu.";
      return;
    }
    state.posts = [{
      id: "post-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      username: profile.username,
      message,
      own: true
    }, ...(state.posts || [])].slice(0, 30);
    save();
    renderPosts();
    input.value = "";
    $("communityMessage").textContent = "Progres dibagikan dalam demo ini.";
    toast("Catatan berhasil dibagikan.");
  });

  // Reward demo.
  document.querySelectorAll(".reward-claim").forEach(button => {
    button.addEventListener("click", () => {
      const key = "reward-" + button.dataset.reward;
      const cost = Number(button.dataset.cost);
      if (state.completed.includes(key)) return;
      if (state.points < cost) {
        $("rewardMessage").textContent = "Eco-Points belum cukup untuk reward ini.";
        return;
      }
      state.points -= cost;
      state.completed.push(key);
      save();
      render();
      $("rewardMessage").textContent = "Reward berhasil diklaim dalam mode demo.";
      toast("Reward claimed!");
    });
  });

  const tips = {
    overwhelmed: "Coba letakkan ponsel selama 5–10 menit, tarik napas perlahan, lalu pilih satu hal kecil yang ingin kamu lakukan.",
    focus: "Pilih satu tugas, kurangi gangguan yang tidak diperlukan, dan fokus selama 10 menit.",
    consistency: "Turunkan target sampai terasa realistis. Mengulang satu langkah kecil lebih berguna daripada menuntut perubahan sempurna.",
    eco: "Pilih satu aksi hari ini: berjalan untuk jarak dekat, merawat tanaman, atau membawa botol minum sendiri."
  };

  $("getCoachTip").addEventListener("click", () => {
    $("coachResponse").textContent = tips[$("coachMood").value];
  });

  // Jalankan pemeriksaan tanggal secara berkala, termasuk ketika tab aktif kembali.
  resetDailyIfNeeded();
  renderDate();
  renderProfile();
  render();
  renderPosts();
  save();
  saveProfile();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      resetDailyIfNeeded();
      renderDate();
      render();
      renderPosts();
    }
  });

  setInterval(() => {
    const oldDate = state.date;
    resetDailyIfNeeded();
    renderDate();
    if (oldDate !== state.date) {
      render();
      renderPosts();
      toast("Hari baru dimulai. Screen time dan tantangan telah direset.");
    }
  }, 30000);
})();

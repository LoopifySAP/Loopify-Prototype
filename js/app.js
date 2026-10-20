(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const STATE_KEY = "loopifyPrototypeState";
  const PROFILE_KEY = "loopifyProfile";

  const defaults = {
    screenMinutes: 334,
    targetHours: 5,
    points: 70,
    completed: ["starter"],
    streak: 3,
    posts: []
  };

  let state = { ...defaults };
  let profile = {
    username: "Naya",
    gender: "female",
    goal: "focus"
  };

  try {
    state = {
      ...defaults,
      ...JSON.parse(localStorage.getItem(STATE_KEY) || "{}")
    };
  } catch {}

  try {
    profile = {
      ...profile,
      ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}")
    };
  } catch {}

  // Avatar ilustrasi dibuat langsung melalui SVG.
  // Tidak memerlukan file gambar profil tambahan.
  function avatar(gender) {
    const hair = gender === "female" ? "#49372e" : "#302c27";

    const hairstyle = gender === "female"
      ? `<path d="M17 39C12 20 16 7 32 6 49 5 53 20 47 40l-7-3V22c-7 3-14 1-20-3v20z" fill="${hair}"/>`
      : `<path d="M17 25C15 12 24 6 34 6c10 0 16 7 15 18l-7-4c-7 2-13 1-19-2z" fill="${hair}"/>`;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#315a43"/>
        <path d="M7 64c2-14 12-21 25-21s23 7 25 21" fill="#86a887"/>
        ${hairstyle}
        <ellipse cx="32" cy="28" rx="13" ry="16" fill="#d9a77e"/>
        <circle cx="27" cy="29" r="1.3" fill="#352c25"/>
        <circle cx="37" cy="29" r="1.3" fill="#352c25"/>
        <path d="M28 36q4 4 8 0" fill="none" stroke="#8d5544" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function save() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
  }

  function saveProfile() {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {}
  }

  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      el.classList.remove("show");
    }, 2500);
  }

  function formatTime(minutes) {
    return `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
  }

  // Greeting in English, mengikuti waktu lokal perangkat.
  function greeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 15) return "afternoon";
    if (hour >= 15 && hour < 18) return "evening";

    return "night";
  }

  function renderDate() {
    const now = new Date();

    $("greetingTime").textContent = greeting();

    $("currentDate").textContent =
      new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long"
      }).format(now) + " · one small step at a time.";
  }

  function renderProfile() {
    profile.username = (profile.username || "Naya")
      .trim()
      .slice(0, 10) || "Naya";

    const image = avatar(profile.gender);

    $("overviewUsername").textContent = profile.username + ".";
    $("profileAvatar").src = image;
    $("profilePreview").src = image;
    $("profilePreviewName").textContent = profile.username;

    $("usernameInput").value = profile.username;
    $("genderInput").value = profile.gender;
    $("profileGoal").value = profile.goal;
  }

  function renderWeek(id) {
    const el = $(id);
    if (!el) return;

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = (new Date().getDay() + 6) % 7;

    el.replaceChildren();

    days.forEach((day, index) => {
      const wrap = document.createElement("div");
      wrap.className = "week-day";

      const label = document.createElement("span");
      label.textContent = day;

      const dot = document.createElement("div");
      const done = index < Math.min(state.streak, 7);

      dot.className =
        "week-dot" +
        (done ? " done" : "") +
        (index === today ? " today" : "");

      dot.textContent = done ? "✓" : "·";

      wrap.append(label, dot);
      el.append(wrap);
    });
  }

  function render() {
    const time = formatTime(state.screenMinutes);
    const target = Math.max(1, state.targetHours * 60);
    const percentage = Math.round(state.screenMinutes / target * 100);

    const completedChallenges = state.completed.filter(key =>
      ["break", "walk", "plant"].includes(key)
    ).length;

    $("screenTimeValue").textContent = time;
    $("trackerTime").textContent = time;
    $("screenTargetLabel").textContent = state.targetHours + "j";

    $("screenProgressBar").style.width =
      Math.min(100, percentage) + "%";

    $("screenPercent").textContent = percentage + "% dari target";

    ["pointsValue", "progressPoints", "rewardsPoints"].forEach(id => {
      $(id).textContent = state.points;
    });

    $("challengeDone").textContent = completedChallenges;
    $("progressChallenges").textContent = completedChallenges;
    $("streakValue").textContent = state.streak + "-day streak";
    $("progressStreak").textContent = state.streak + " days";

    $("screenHours").value = Math.floor(state.screenMinutes / 60);
    $("screenMinutes").value = state.screenMinutes % 60;
    $("screenTarget").value = String(state.targetHours);

    renderWeek("weekGrid");
    renderWeek("progressWeekGrid");

    document.querySelectorAll(".challenge-complete").forEach(button => {
      const alreadyDone = state.completed.includes(button.dataset.key);

      button.disabled = alreadyDone;
      button.textContent = alreadyDone
        ? "Completed ✓"
        : `Selesaikan · +${button.dataset.points} poin`;
    });

    document.querySelectorAll(".reward-claim").forEach(button => {
      const claimed = state.completed.includes(
        "reward-" + button.dataset.reward
      );

      button.disabled = claimed;
      button.textContent = claimed
        ? "Claimed ✓"
        : button.dataset.cost === "0"
          ? "Klaim lencana"
          : "Klaim reward";
    });
  }

  // Navigasi antarhalaman dashboard.
  function go(view) {
    document.querySelectorAll(".view").forEach(section => {
      section.classList.toggle("active", section.id === "view-" + view);
    });

    document.querySelectorAll(".nav-item").forEach(button => {
      button.classList.toggle("active", button.dataset.view === view);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => go(button.dataset.view));
  });

  document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => go(button.dataset.go));
  });

  // Profile modal.
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

  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  // Preview profil berubah saat username atau gender diubah.
  $("usernameInput").addEventListener("input", () => {
    $("usernameInput").value = $("usernameInput").value.slice(0, 10);
    $("profilePreviewName").textContent =
      $("usernameInput").value || "Naya";
  });

  $("genderInput").addEventListener("change", () => {
    $("profilePreview").src = avatar($("genderInput").value);
  });

  $("profileForm").addEventListener("submit", event => {
    event.preventDefault();

    const username = $("usernameInput").value.trim().slice(0, 10);

    if (!username) {
      $("profileMessage").textContent = "Username tidak boleh kosong.";
      return;
    }

    profile = {
      username,
      gender: $("genderInput").value,
      goal: $("profileGoal").value
    };

    saveProfile();
    renderProfile();

    $("profileMessage").textContent = "Profile saved successfully.";
    toast("Profile berhasil disimpan.");

    setTimeout(closeModal, 350);
  });

  // Screen time manual tracker.
  $("saveScreenTime").addEventListener("click", () => {
    const hours = Number($("screenHours").value);
    const minutes = Number($("screenMinutes").value);
    const target = Number($("screenTarget").value);

    if (
      !Number.isInteger(hours) || hours < 0 || hours > 23 ||
      !Number.isInteger(minutes) || minutes < 0 || minutes > 59
    ) {
      $("trackerMessage").textContent =
        "Masukkan jam 0–23 dan menit 0–59.";
      return;
    }

    state.screenMinutes = hours * 60 + minutes;
    state.targetHours = target;

    save();
    render();

    $("trackerMessage").textContent =
      "Screen time berhasil diperbarui.";

    toast("Screen time updated.");
  });

  // Daily challenges.
  document.querySelectorAll(".challenge-complete").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.key;

      if (state.completed.includes(key)) return;

      state.completed.push(key);
      state.points += Number(button.dataset.points);
      state.streak = Math.max(4, state.streak);

      save();
      render();

      $("challengeMessage").textContent =
        "Tantangan selesai dan Eco-Points ditambahkan.";

      toast("Challenge completed!");
    });
  });

  // Community demo feed.
  function renderPosts() {
    const feed = $("communityFeed");
    feed.replaceChildren();

    const posts = [
      ...(state.posts || []),
      {
        username: "Rani",
        message: "Hari ini mencoba makan siang tanpa scroll. Rasanya lebih hadir."
      },
      {
        username: "Arga",
        message: "Mulai dari jeda 10 menit dulu. Small steps count!"
      }
    ];

    posts.forEach(post => {
      const item = document.createElement("div");
      item.className = "feed-item";

      const name = document.createElement("strong");
      name.textContent = post.username;

      const message = document.createElement("p");
      message.textContent = post.message;

      item.append(name, message);
      feed.append(item);
    });
  }

  $("sharePost").addEventListener("click", () => {
    const input = $("communityPost");
    const message = input.value.trim();

    if (!message) {
      $("communityMessage").textContent =
        "Tulis satu langkah kecilmu terlebih dahulu.";
      return;
    }

    state.posts = [
      { username: profile.username, message },
      ...(state.posts || [])
    ].slice(0, 8);

    save();
    renderPosts();

    input.value = "";
    $("communityMessage").textContent =
      "Progres dibagikan dalam demo ini.";

    toast("Your small step has been shared.");
  });

  // Rewards demo.
  document.querySelectorAll(".reward-claim").forEach(button => {
    button.addEventListener("click", () => {
      const key = "reward-" + button.dataset.reward;
      const cost = Number(button.dataset.cost);

      if (state.completed.includes(key)) return;

      if (state.points < cost) {
        $("rewardMessage").textContent =
          "Eco-Points belum cukup untuk reward ini.";
        return;
      }

      state.points -= cost;
      state.completed.push(key);

      save();
      render();

      $("rewardMessage").textContent =
        "Reward berhasil diklaim dalam mode demo.";

      toast("Reward claimed!");
    });
  });

  // Mindful Coach Lite: rule-based responses.
  const tips = {
    overwhelmed:
      "Coba letakkan ponsel selama 5–10 menit, tarik napas perlahan, lalu pilih satu hal kecil yang ingin kamu lakukan.",
    focus:
      "Pilih satu tugas, matikan gangguan yang tidak diperlukan, dan fokus selama 10 menit.",
    consistency:
      "Turunkan target sampai terasa realistis. Mengulang satu langkah kecil lebih berguna daripada menuntut perubahan sempurna.",
    eco:
      "Pilih satu aksi hari ini: berjalan untuk jarak dekat, merawat tanaman, atau membawa botol minum sendiri."
  };

  $("getCoachTip").addEventListener("click", () => {
    $("coachResponse").textContent = tips[$("coachMood").value];
  });

  // Initial render.
  renderDate();
  renderProfile();
  render();
  renderPosts();
  saveProfile();

  // Update greeting and date when returning to the tab.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) renderDate();
  });

  // Keep the displayed date and greeting current.
  setInterval(renderDate, 60000);
})();

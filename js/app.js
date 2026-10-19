
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const KEY = 'loopifyPrototypeV1';

  const defaults = {
    points: 120,
    minutes: 144,
    target: 210,
    completed: ['pause'],
    total: 4,
    streak: 3,
    reminder: true,
    time: '14:00',
    joined: false,
    partner: '',
    redeemed: []
  };

  let s = { ...defaults };

  try {
    s = { ...s, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch (e) {}

  let toastTimer;

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {}
  }

  function toast(t) {
    const el = $('#toast');
    el.textContent = t;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function fmt(n) {
    let h = Math.floor(n / 60);
    let m = n % 60;
    return h && m ? `${h}j ${m}m` : h ? `${h}j` : `${m}m`;
  }

  function pct() {
    return Math.min(100, Math.round(s.minutes / s.target * 100));
  }

  // Navigasi antarhalaman
  function go(v) {
    const el = $('#view-' + v);
    if (!el) return;

    $$('.view').forEach(x => x.classList.toggle('active', x === el));
    $$('.nav').forEach(x => x.classList.toggle('active', x.dataset.view === v));

    $('#sidebar').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $$('.nav').forEach(b =>
    b.addEventListener('click', () => go(b.dataset.view))
  );

  $$('[data-go]').forEach(b =>
    b.addEventListener('click', () => go(b.dataset.go))
  );

  $('#menu').addEventListener('click', () =>
    $('#sidebar').classList.toggle('open')
  );

  // Tampilan progres mingguan
  function week() {
    const names = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    $('#week').innerHTML = names.map((d, i) => `
      <div class="day ${
        i < 3 || (i === 3 && s.completed.length) ? 'done' : ''
      } ${i === 3 ? 'today' : ''}">
        <span>${d}</span>
        <b>${i < 3 || (i === 3 && s.completed.length) ? '✓' : '·'}</b>
      </div>
    `).join('');
  }

  // Grafik aktivitas tujuh hari
  function chart() {
    const vals = [35, 55, 42, 68, 50, 76,
      Math.min(95, 35 + s.completed.length * 10)];

    $('#chart').innerHTML = vals.map((v, i) => `
      <div class="barcol ${i === 6 ? 'current' : ''}">
        <span class="barval">${v}%</span>
        <div class="bar" style="--height:${v}%"></div>
        <span>${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}</span>
      </div>
    `).join('');
  }

  // Memperbarui tampilan dari state aplikasi
  function render() {
    let p = pct();
    let t = fmt(s.minutes);

    ['#dash-time', '#tracker-time'].forEach(q => {
      $(q).textContent = t;
    });

    $('#dash-target').textContent = fmt(s.target);
    $('#target-label').textContent = fmt(s.target);
    $('#dash-percent').textContent = p + '% dari target';
    $('#tracker-percent').textContent = p + '%';
    $('#dash-fill').style.width = p + '%';
    $('#tracker-fill').style.width = p + '%';
    $('#target').value = String(s.target);

    $('#dash-points').textContent = s.points;
    $('#reward-points').textContent = s.points;

    let count = Math.min(3, s.completed.length);

    $('#dash-done').textContent = count;
    $('#challenge-count').textContent = count;
    $('#ring-label').textContent = Math.round(count / 3 * 100) + '%';

    $('#ring').style.background =
      `conic-gradient(var(--green) ${count / 3 * 100}%, #cfdcc7 0)`;

    $('#progress-total').textContent = s.total;
    $('#progress-streak').innerHTML = `${s.streak} <small>hari</small>`;
    $('#streak-chip').textContent = '✳ ' + s.streak + '-day streak';

    // Status setiap tantangan
    $$('.challenge').forEach(c => {
      let done = s.completed.includes(c.dataset.id);
      let b = $('.complete', c);

      c.classList.toggle('completed', done);
      b.disabled = done;
      b.textContent = done ? '✓ Selesai hari ini' : 'Tandai selesai';
    });

    // Pengingat
    $('#reminder-toggle').checked = s.reminder;
    $('#reminder-time').value = s.time;

    // Komunitas dan partner
    $('#partner-status').textContent = s.partner
      ? `Ajakan simulasi sudah disiapkan untuk ${s.partner}.`
      : 'Belum ada ajakan yang dikirim.';

    $('#community-status').textContent = s.joined
      ? 'Kamu sudah bergabung dengan tantangan demo ini. Let’s grow together!'
      : 'Kamu belum bergabung dengan tantangan demo ini.';

    $('#join').textContent = s.joined
      ? 'Keluar dari demo challenge'
      : 'Ikut tantangan (simulasi)';

    // Status reward
    $$('.reward').forEach(c => {
      let done = s.redeemed.includes(c.dataset.reward);
      let b = $('.redeem', c);

      b.disabled = done;
      b.textContent = done ? '✓ Ditukarkan' : 'Tukarkan';
    });

    week();
    chart();
  }

  // Menyelesaikan tantangan dan mendapatkan Eco-Points
  $$('.complete').forEach(b => {
    b.addEventListener('click', () => {
      let c = b.closest('.challenge');
      let id = c.dataset.id;

      if (s.completed.includes(id)) return;

      s.completed.push(id);
      s.points += Number(c.dataset.points);
      s.total++;

      save();
      render();

      toast(`Tantangan selesai! +${c.dataset.points} Eco-Points 🌿`);
    });
  });

  // Simulasi penambahan screen time
  $('#add-time').addEventListener('click', () => {
    let n = Number($('#extra-minutes').value);

    if (!Number.isFinite(n) || n < 5 || n > 120) {
      toast('Masukkan durasi antara 5–120 menit.');
      return;
    }

    s.minutes += n;
    save();
    render();

    toast(`Screen time simulasi bertambah ${n} menit.`);
  });

  // Mengubah target harian
  $('#target').addEventListener('change', e => {
    s.target = Number(e.target.value);

    save();
    render();

    toast('Target harian diperbarui.');
  });

  // Mengaktifkan atau menonaktifkan pengingat demo
  $('#reminder-toggle').addEventListener('change', e => {
    s.reminder = e.target.checked;
    save();

    $('#reminder-status').textContent = s.reminder
      ? `Pengingat demo aktif pukul ${s.time}; notifikasi otomatis belum diaktifkan.`
      : 'Pengingat demo dinonaktifkan.';
  });

  // Menyimpan pengaturan pengingat
  $('#save-reminder').addEventListener('click', () => {
    s.time = $('#reminder-time').value || '14:00';
    s.reminder = $('#reminder-toggle').checked;

    save();

    $('#reminder-status').textContent = s.reminder
      ? `Pengaturan tersimpan: pengingat demo pukul ${s.time}. Belum ada notifikasi otomatis.`
      : 'Pengingat dinonaktifkan.';

    toast('Pengaturan pengingat disimpan.');
  });

  // Simulasi ajakan accountability partner
  $('#invite').addEventListener('click', () => {
    s.partner = $('#partner').value.split(' · ')[0];

    save();
    render();

    toast(`Ajakan demo disiapkan untuk ${s.partner}.`);
  });

  // Bergabung atau keluar dari tantangan komunitas
  $('#join').addEventListener('click', () => {
    s.joined = !s.joined;

    save();
    render();

    toast(
      s.joined
        ? 'Kamu bergabung! 🌱'
        : 'Kamu keluar dari tantangan demo.'
    );
  });

  // Menukarkan Eco-Points
  $$('.redeem').forEach(b => {
    b.addEventListener('click', () => {
      let c = b.closest('.reward');
      let id = c.dataset.reward;
      let cost = Number(c.dataset.cost);

      if (s.redeemed.includes(id)) return;

      if (s.points < cost) {
        toast('Poinmu belum cukup untuk reward ini.');
        return;
      }

      s.points -= cost;
      s.redeemed.push(id);

      save();
      render();

      $('#reward-status').textContent =
        `Reward “${$('h3', c).textContent}” ditukarkan dalam simulasi. Tidak ada reward nyata yang dikirim.`;

      toast(`Reward demo ditukarkan. −${cost} poin.`);
    });
  });

  // Basis aturan untuk Mindful Coach Lite
  const advice = {
    focus: {
      low: [
        'Mulai dengan target ringan.',
        'Pilih satu tugas kecil selama beberapa menit, lalu istirahat jika perlu.',
        'Fokus singkat'
      ],
      medium: [
        'Buat ruang untuk satu hal.',
        'Letakkan notifikasi di luar perhatian dan kerjakan satu tugas selama waktu pilihanmu.',
        'Satu tugas, satu waktu'
      ],
      high: [
        'Manfaatkan energi dengan realistis.',
        'Coba satu sesi fokus tanpa berpindah aplikasi, lalu sisipkan jeda.',
        'Sesi fokus mindful'
      ]
    },
    rest: {
      low: [
        'Istirahat juga progres.',
        'Duduk nyaman, minum air, dan jauhkan layar sebentar.',
        'Jeda lembut'
      ],
      medium: [
        'Beri mata dan pikiran ruang.',
        'Peregangan ringan atau lihat pemandangan jauh dari layar.',
        'Jeda dari layar'
      ],
      high: [
        'Arahkan energi ke dunia nyata.',
        'Coba jalan singkat tanpa membuka ponsel jika situasinya aman.',
        'Jalan mindful'
      ]
    },
    sleep: {
      low: [
        'Tidak perlu mengubah semuanya.',
        'Letakkan ponsel sedikit lebih jauh saat bersiap tidur.',
        'Persiapan tidur tenang'
      ],
      medium: [
        'Buat akhir hari lebih pelan.',
        'Pilih waktu tanpa scrolling sebelum tidur dan lakukan rutinitas tenang.',
        'Jeda sebelum tidur'
      ],
      high: [
        'Coba batas kecil yang konsisten.',
        'Atur pengingat untuk mulai winding down dan ganti scrolling dengan membaca.',
        'Waktu winding down'
      ]
    },
    green: {
      low: [
        'Aktivitas kecil tetap berarti.',
        'Rawat tanaman atau rapikan satu sudut kecil di sekitarmu.',
        'Satu aksi kecil'
      ],
      medium: [
        'Isi jeda layar dengan hal nyata.',
        'Siram tanaman, rapikan sudut, atau berjalan singkat.',
        'Aksi kecil yang hijau'
      ],
      high: [
        'Satukan jeda digital dengan aksi positif.',
        'Ajak seseorang melakukan aktivitas singkat di luar layar.',
        'Grow together'
      ]
    }
  };

  $('#coach-button').addEventListener('click', () => {
    let goal = $('#goal').value;
    let time = $('#time-choice').value;
    let energy = $('input[name="energy"]:checked').value;

    let [title, text, action] = advice[goal][energy];

    $('#coach-title').textContent = title;
    $('#coach-text').textContent = text;
    $('#coach-action').textContent = `${action} · ${time} menit`;
    $('#coach-detail').textContent =
      `Coba selama ${time} menit jika terasa nyaman. Kamu boleh menyesuaikan atau melewatkannya sesuai kebutuhan.`;

    toast('Saran mindful personal dibuat.');
  });

  // Tanggal pada header
  $('#date').textContent =
    new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }) + ' · satu langkah kecil.';

  render();
})();

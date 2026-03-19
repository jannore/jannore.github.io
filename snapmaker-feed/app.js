(function () {
  var items = [];
  var idx = 0;
  var usingA = true;

  var mediaPositions = [];
  var totalMedia = 0;

  var wrap = document.getElementById("wrap");
  var slideA = document.getElementById("slideA");
  var slideB = document.getElementById("slideB");

  var metaLeft = document.getElementById("metaLeft");
  var metaRight = document.getElementById("metaRight");

  var openLink = document.getElementById("openLink");

  var topProgressText = document.getElementById("topProgressText");
  var topProgressFill = document.getElementById("topProgressFill");

  var toast = document.getElementById("toast");

  var restartTimer = null;

  function showToast(msg) {
    toast.style.display = "block";
    toast.textContent = msg;
    setTimeout(function () { toast.style.display = "none"; }, 1600);
  }

  function clearSlide(slide) {
    while (slide.firstChild) slide.removeChild(slide.firstChild);
  }

  function pauseAllVideos() {
    var vids = document.getElementsByTagName("video");
    for (var i = 0; i < vids.length; i++) {
      try { vids[i].pause(); } catch (e) {}
    }
  }

  function absolutize(src) {
    if (!src) return "";
    if (/^https?:\/\//i.test(src)) return src;
    var a = document.createElement("a");
    a.href = src;
    return a.href;
  }

  function addMotivationSlides(mediaList) {
    if (!mediaList || mediaList.length === 0) return [];

    var messages = [
      "Tubli! Jätka samas vaimus 💪",
      "Väga hästi – ainult mõned sammud veel!",
      "Super töö siiani! Hoia fookust!",
      "Nice! Sa liigud kindlalt edasi!",
      "Hästi tehtud! Peaaegu valmis!"
    ];

    var out = [];
    var msgIndex = 0;

    for (var i = 0; i < mediaList.length; i++) {
      out.push(mediaList[i]);

      var stepNumber = i + 1;
      var isEvery5 = (stepNumber % 5 === 0);
      var notLast = (stepNumber !== mediaList.length);

      if (isEvery5 && notLast) {
        out.push({
          type: "milestone",
          title: "Vahepeatus ✅",
          message: messages[msgIndex % messages.length]
        });
        msgIndex++;
      }
    }

    out.push({
      type: "final",
      title: "Valmis! 🎉",
      message: "Tubli töö — oled juhendi läbi teinud. Oskad nüüd iseseisvalt tegutseda! ✅"
    });

    return out;
  }

  function rebuildMediaMap() {
    mediaPositions = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i] && (items[i].type === "image" || items[i].type === "video")) {
        mediaPositions.push(i);
      }
    }
    totalMedia = mediaPositions.length;
  }

  function mediaDoneAt(index) {
    var done = 0;
    for (var i = 0; i < mediaPositions.length; i++) {
      if (mediaPositions[i] <= index) done++;
      else break;
    }
    return done;
  }

  function renderInto(slide, it) {
    clearSlide(slide);

    // 🔴 STOP previous timer if changing slides
    if (restartTimer) {
      clearInterval(restartTimer);
      restartTimer = null;
    }

    var title = (it && it.title) ? String(it.title) : "";
    var src = absolutize(it && it.src ? String(it.src) : "");

    if (!it || !it.type) {
      var div0 = document.createElement("div");
      div0.textContent = "Puudub sisu";
      slide.appendChild(div0);
      openLink.style.display = "none";
      return;
    }

    if (it.type === "milestone" || it.type === "final") {
      var box = document.createElement("div");
      box.style.textAlign = "center";
      box.style.padding = "40px 22px";
      box.style.maxWidth = "560px";
      box.style.lineHeight = "1.45";

      var isFinal = (it.type === "final");

      var html =
        "<div style='font-size:52px; margin-bottom:10px;'>" + (isFinal ? "🏁" : "✨") + "</div>" +
        "<h2 style='margin:0 0 12px 0; color:#a855f7; font-size:28px;'>" + (it.title || "") + "</h2>" +
        "<p style='margin:0 0 20px 0; font-size:18px; color:#fff; opacity:0.92;'>" + (it.message || "") + "</p>";

      if (isFinal) {
        html += "<button id='restartBtn' style='padding:12px 18px; font-size:16px; border:none; border-radius:12px; background:#a855f7; color:#fff;'>Tagasi algusesse 5</button>";
      }

      box.innerHTML = html;
      slide.appendChild(box);

      if (isFinal) {
        setTimeout(function () {
          var btn = document.getElementById("restartBtn");
          if (!btn) return;

          var count = 5;

          restartTimer = setInterval(function () {
            count--;
            if (count > 0) {
              btn.textContent = "Tagasi algusesse " + count;
            } else {
              clearInterval(restartTimer);
              restartTimer = null;
              idx = 0;
              showInitial();
            }
          }, 1000);

          btn.onclick = function () {
            clearInterval(restartTimer);
            restartTimer = null;
            idx = 0;
            showInitial();
          };
        }, 0);
      }

      openLink.style.display = "none";
      return;
    }

    if (!src) {
      var div = document.createElement("div");
      div.textContent = "Puudub src";
      slide.appendChild(div);
      openLink.style.display = "none";
      return;
    }

    if (it.type === "video") {
      var v = document.createElement("video");
      v.src = src;
      v.controls = false;
      v.loop = true;
      v.muted = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "playsinline");

      slide.appendChild(v);

      v.addEventListener("click", function () {
        if (v.paused) v.play();
        else v.pause();
      });

      openLink.style.display = "block";
      openLink.href = src;
      openLink.textContent = title ? "Ava video" : "Ava fail";
    } else {
      var img = document.createElement("img");
      img.src = src;
      img.alt = title || "";
      slide.appendChild(img);

      openLink.style.display = "block";
      openLink.href = src;
      openLink.textContent = title ? "Ava pilt" : "Ava fail";
    }
  }

  function setProgress() {
    var cur = totalMedia ? mediaDoneAt(idx) : 0;
    topProgressText.textContent = cur + " / " + totalMedia;
    topProgressFill.style.width = (totalMedia ? (cur / totalMedia * 100) : 0) + "%";
  }

  function setMeta() {
    if (!items.length) {
      metaLeft.textContent = "Ei leidnud ühtegi faili (media_index.json).";
      metaRight.textContent = "";
      setProgress();
      openLink.style.display = "none";
      return;
    }

    var it = items[idx];
    metaLeft.textContent = (it.title || it.src || "");
    metaRight.textContent = (totalMedia ? mediaDoneAt(idx) : 0) + " / " + totalMedia;
    setProgress();
  }

  function showInitial() {
    if (!items.length) {
      slideA.style.transform = "translateY(0)";
      slideB.style.transform = "translateY(100%)";
      setMeta();
      return;
    }

    renderInto(slideA, items[idx]);
    slideA.style.transform = "translateY(0)";
    slideB.style.transform = "translateY(100%)";
    setMeta();
  }

  function transition(dir) {
    if (!items.length) return;

    var nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= items.length) {
      showToast(dir > 0 ? "Viimane samm" : "Esimene samm");
      return;
    }

    pauseAllVideos();

    var currentSlide = usingA ? slideA : slideB;
    var nextSlide = usingA ? slideB : slideA;

    renderInto(nextSlide, items[nextIdx]);

    nextSlide.style.transition = "none";
    nextSlide.style.transform = (dir === 1) ? "translateY(100%)" : "translateY(-100%)";
    nextSlide.offsetHeight;

    nextSlide.style.transition = "transform 220ms ease";
    currentSlide.style.transition = "transform 220ms ease";
    nextSlide.style.transform = "translateY(0)";
    currentSlide.style.transform = (dir === 1) ? "translateY(-100%)" : "translateY(100%)";

    setTimeout(function () {
      idx = nextIdx;
      usingA = !usingA;
      setMeta();
    }, 230);
  }

  function next() { transition(1); }
  function prev() { transition(-1); }

  var startY = null;

  wrap.addEventListener("touchstart", function (e) {
    if (!e.touches || !e.touches.length) return;
    startY = e.touches[0].clientY;
  }, { passive: true });

  wrap.addEventListener("touchend", function (e) {
    if (startY === null) return;
    var endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : startY;
    var dy = endY - startY;
    startY = null;

    if (Math.abs(dy) < 40) return;
    if (dy < 0) next(); else prev();
  }, { passive: true });

  wrap.addEventListener("wheel", function (e) {
    if (e.deltaY > 0) next();
    else if (e.deltaY < 0) prev();
  });

  fetch("media_index.json", { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("media_index.json HTTP " + r.status);
      return r.json();
    })
    .then(function (data) {
      var list = (data && data.items) ? data.items : [];

      var mediaOnly = [];
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (!it || !it.type || !it.src) continue;
        if (it.type !== "image" && it.type !== "video") continue;
        mediaOnly.push(it);
      }

      items = addMotivationSlides(mediaOnly);
      rebuildMediaMap();

      idx = 0;
      showInitial();
    })
    .catch(function (err) {
      metaLeft.textContent = "VIGA: " + (err && err.message ? err.message : String(err));
      metaRight.textContent = "";
      setProgress();
      openLink.style.display = "none";
    });
})();

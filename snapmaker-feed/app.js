(function () {
  // ✅ CHANGE ONLY IF REPO NAME IS DIFFERENT
  var OWNER = "jannore";
  var REPO = "snapmaker-feed";
  var MEDIA_PATH = "media";

  var items = [];
  var idx = 0;
  var usingA = true;

  var wrap = document.getElementById("wrap");
  var slideA = document.getElementById("slideA");
  var slideB = document.getElementById("slideB");

  var metaLeft = document.getElementById("metaLeft");
  var metaRight = document.getElementById("metaRight");

  var openLink = document.getElementById("openLink");

  var topProgressText = document.getElementById("topProgressText");
  var topProgressFill = document.getElementById("topProgressFill");

  var toast = document.getElementById("toast");

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

  function renderInto(slide, it) {
    clearSlide(slide);

    var title = (it && it.title) ? String(it.title) : "";
    var src = absolutize(it && it.src ? String(it.src) : "");

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
      v.controls = true;

      v.loop = true;
      v.muted = true;
      v.autoplay = true;

      v.playsInline = true;
      v.setAttribute("playsinline", "playsinline");

      slide.appendChild(v);

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
    var total = items.length || 0;
    var cur = total ? (idx + 1) : 0;
    topProgressText.textContent = cur + " / " + total;
    topProgressFill.style.width = (total ? (cur / total * 100) : 0) + "%";
  }

  function setMeta() {
    if (!items.length) {
      metaLeft.textContent = "Ei leidnud ühtegi faili kaustast /media.";
      metaRight.textContent = "";
      setProgress();
      openLink.style.display = "none";
      return;
    }
    var it = items[idx];
    metaLeft.textContent = (it.title || it.src || "");
    metaRight.textContent = (idx + 1) + " / " + items.length;
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

  // Swipe
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

  // Wheel
  wrap.addEventListener("wheel", function (e) {
    if (e.deltaY > 0) next();
    else if (e.deltaY < 0) prev();
  });

  // --------- NEW: load media list from GitHub API ---------
  function extractLeadingNumber(name) {
    // "001_foo.mp4" -> 1, "12.jpg" -> 12, "foo.mp4" -> Infinity
    var m = String(name || "").match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : 999999999;
  }

  function guessTypeFromName(name) {
    name = (name || "").toLowerCase();
    if (/\.(mp4|webm|mov)$/i.test(name)) return "video";
    return "image";
  }

  function toTitle(name) {
    // strip extension
    var base = String(name || "").replace(/\.[^/.]+$/, "");
    return base;
  }

  function loadFromGithub() {
    // List contents of /media via GitHub REST API
    var api = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + MEDIA_PATH;

    fetch(api, {
      headers: { "Accept": "application/vnd.github+json" },
      cache: "no-store"
    })
      .then(function (r) {
        if (!r.ok) throw new Error("GitHub API HTTP " + r.status);
        return r.json();
      })
      .then(function (list) {
        // list: array of {name, download_url, type:'file'}
        var out = [];
        for (var i = 0; i < list.length; i++) {
          var f = list[i];
          if (!f || f.type !== "file") continue;

          var name = f.name || "";
          // allow only common media extensions
          if (!/\.(jpg|jpeg|png|gif|mp4|webm|mov)$/i.test(name)) continue;

          out.push({
            type: guessTypeFromName(name),
            src: f.download_url,     // direct file URL
            title: toTitle(name),
            order: extractLeadingNumber(name)
          });
        }

        out.sort(function (a, b) {
          if (a.order !== b.order) return a.order - b.order;
          return String(a.title).localeCompare(String(b.title));
        });

        items = out;
        idx = 0;
        showInitial();
      })
      .catch(function (err) {
        metaLeft.textContent = "VIGA: " + (err && err.message ? err.message : String(err));
        metaRight.textContent = "";
        setProgress();
        openLink.style.display = "none";
      });
  }

  loadFromGithub();
})();

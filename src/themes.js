export const themes = {
    synthwave: { 
    name: "ÖZEL (Synthwave)", 
    isSpecial: true, // Bu bir özel tema
    colors: { 
      "--bg-color-pomodoro": "#1a103c", // Derin Gece Moru
      "--bg-color-short": "#472c63",    // Neon Moru
      "--bg-color-long": "#2c3e63",     // Gece Mavisi
      // Bu temaya özel ek renkler
      "--text-color": "#f0d5f7",        // Soluk Neon Pembe Yazı
      "--text-color-dark": "#ffffff",   // Saf Beyaz
      "--primary-accent": "#00b5d7",    // Canlı Turkuvaz
      "--card-bg": "rgba(44, 46, 99, 0.5)", // Yarı saydam Mor Kart
      "--card-border": "rgba(255, 0, 229, 0.4)", // Pembe Neon Kenarlık
      "--progress-active-color": "#00b5d7", // Canlı Turkuvaz
      "--progress-inactive-color": "#ff00e5", // Neon Pembe
      "--progress-bg-color": "rgba(255, 0, 229, 0.2)" // Açık Neon Pembe
    } 
  },
  dark_academia: { 
    name: "ÖZEL (Dark Academia)", 
    colors: { 
      "--bg-color-pomodoro": "#4a3f35", // Koyu Ahşap
      "--bg-color-short": "#6b5a4a",    // Eskitilmiş Deri
      "--bg-color-long": "#5a6650",     // Koyu Yeşil
      // Bu temaya özel ek renkler
      "--text-color": "#dcd1b8",        // Parşömen Yazı Rengi
      "--text-color-dark": "#3c3228",   // Mürekkep Rengi
      "--primary-accent": "#c2a26c",    // Altın Vurgu Rengi
      "--card-bg": "rgba(30, 25, 20, 0.65)", // Koyu, opak kart
      "--card-border": "rgba(194, 162, 108, 0.5)", // Altın Kenarlık
      "--progress-active-color": "#c2a26c", // Altın
      "--progress-inactive-color": "#8b7355", // Koyu Altın
      "--progress-bg-color": "rgba(194, 162, 108, 0.2)" // Açık Altın
    } 
  },
   gothic_core: { 
    name: "ÖZEL (Gothic Core)", 
    colors: { 
      "--bg-color-pomodoro": "#2b212f", // Koyu Mürdüm / Siyah
      "--bg-color-short": "#4e4359",    // Soluk Lavanta Grisi
      "--bg-color-long": "#3f364a",     // Mürdüm Grisi
      // Bu temaya özel ek renkler
      "--text-color": "#d9d7dd",        // Soluk Gümüş Yazı Rengi
      "--text-color-dark": "#1c1820",   // Koyu Mürekkep Rengi
      "--primary-accent": "#a08a99",    // Kan Kırmızısı Vurgu
      "--card-bg": "rgba(28, 24, 32, 0.75)", // Koyu, opak kart
      "--card-border": "#582c51", // Kırmızı Kenarlık
      "--progress-active-color": "#a08a99", // Gümüş
      "--progress-inactive-color": "#8b5a6b", // Koyu Gümüş
      "--progress-bg-color": "rgba(160, 138, 153, 0.2)" // Açık Gümüş
    } 
  },
  default: { 
    name: "Varsayılan Mavi", 
    colors: { 
      "--bg-color-pomodoro": "#2A3D66", 
      "--bg-color-short": "#3A668C", 
      "--bg-color-long": "#5A94B2",
      "--progress-active-color": "#4ECDC4",
      "--progress-inactive-color": "#FF6B6B",
      "--progress-bg-color": "rgba(78, 205, 196, 0.2)"
    } 
  },
  forest: { 
    name: "Orman Yeşili", 
    colors: { 
      "--bg-color-pomodoro": "#2d5a33", 
      "--bg-color-short": "#3a7d44", 
      "--bg-color-long": "#5a9e64",
      "--progress-active-color": "#4CAF50",
      "--progress-inactive-color": "#8BC34A",
      "--progress-bg-color": "rgba(76, 175, 80, 0.2)"
    } 
  },
  sunset: { 
    name: "Gün Batımı", 
    colors: { 
      "--bg-color-pomodoro": "#c7384a", 
      "--bg-color-short": "#e07a5f", 
      "--bg-color-long": "#f4a261",
      "--progress-active-color": "#FF9800",
      "--progress-inactive-color": "#FF5722",
      "--progress-bg-color": "rgba(255, 152, 0, 0.2)"
    } 
  },
  ocean: { 
    name: "Okyanus", 
    colors: { 
      "--bg-color-pomodoro": "#00628e", 
      "--bg-color-short": "#007ea7", 
      "--bg-color-long": "#0096c7",
      "--progress-active-color": "#00BCD4",
      "--progress-inactive-color": "#FF4081",
      "--progress-bg-color": "rgba(0, 188, 212, 0.2)"
    } 
  },
  lavender: { 
    name: "Lavanta", 
    colors: { 
      "--bg-color-pomodoro": "#5a189a", 
      "--bg-color-short": "#7b2cbf", 
      "--bg-color-long": "#9d4edd",
      "--progress-active-color": "#9C27B0",
      "--progress-inactive-color": "#E91E63",
      "--progress-bg-color": "rgba(156, 39, 176, 0.2)"
    } 
  },
  coffee: { 
    name: "Kahve", 
    colors: { 
      "--bg-color-pomodoro": "#4a2c2a", 
      "--bg-color-short": "#6f453b", 
      "--bg-color-long": "#a0715c",
      "--progress-active-color": "#8D6E63",
      "--progress-inactive-color": "#A1887F",
      "--progress-bg-color": "rgba(141, 110, 99, 0.2)"
    } 
  },
  matrix: { 
    name: "Matrix", 
    colors: { 
      "--bg-color-pomodoro": "#003800", 
      "--bg-color-short": "#005f00", 
      "--bg-color-long": "#008700",
      "--progress-active-color": "#00FF00",
      "--progress-inactive-color": "#4CAF50",
      "--progress-bg-color": "rgba(0, 255, 0, 0.2)"
    } 
  },
  rose: { 
    name: "Gül Tozu", 
    colors: { 
      "--bg-color-pomodoro": "#b56576", 
      "--bg-color-short": "#e56b6f", 
      "--bg-color-long": "#eaac8b",
      "--progress-active-color": "#E91E63",
      "--progress-inactive-color": "#F06292",
      "--progress-bg-color": "rgba(233, 30, 99, 0.2)"
    } 
  },
  slate: { 
    name: "Koyu Gri", 
    colors: { 
      "--bg-color-pomodoro": "#263238", 
      "--bg-color-short": "#37474f", 
      "--bg-color-long": "#455a64",
      "--progress-active-color": "#757575",
      "--progress-inactive-color": "#9E9E9E",
      "--progress-bg-color": "rgba(117, 117, 117, 0.2)"
    } 
  },
  sand: { 
    name: "Kum", 
    colors: { 
      "--bg-color-pomodoro": "#cc9543", 
      "--bg-color-short": "#e5ab5b", 
      "--bg-color-long": "#f2c589",
      "--progress-active-color": "#FFC107",
      "--progress-inactive-color": "#FF9800",
      "--progress-bg-color": "rgba(255, 193, 7, 0.2)"
    } 
  },
};
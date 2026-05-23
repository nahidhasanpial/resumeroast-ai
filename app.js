/**
 * ResumeRoast AI — Core SPA Application Controller
 */

// Application State
const state = {
  activeView: 'view-home', // 'view-home', 'view-loading', 'view-results'
  selectedFile: null,
  extractedText: '',
  apiKey: '',
  isPro: false,
  history: [],
  currentRoastData: null // Stores the active roasted result
};

// SVG Circle properties for score ring
const SCORE_CIRCUMFERENCE = 2 * Math.PI * 40; // 251.2

// Witty roasting messages
const ROAST_QUOTES = [
  "Turning up the toaster heat dials...",
  "Sniffing out buzzwords in your summary...",
  "Giggling at your 'detail-oriented' profile...",
  "Spreading premium butter on achievements...",
  "Running ATS compliance scanners...",
  "Scorching clunky paragraph formatting...",
  "Drafting brutal corporate feedback...",
  "Polishing metric-driven bullet points...",
  "Consulting the recruiter oracle...",
  "Placing resume in final toaster slot..."
];

// Document Elements
let dropzone, fileSelector, fileInput, fileCard, fileNameLabel, fileSizeLabel, fileRemoveBtn;
let roleSelect, jdTextarea, roastBtn, backBtn;
let apiSection, apiToggleBtn, saveKeyBtn, clearKeyBtn, apiKeyInput, apiStatusLabel;
let premiumIndicator, paywallOverlay, premiumContainer, unlockPaywallBtn;
let modalPayment, billingCloseBtn, billingSubmitBtn, billingDoneBtn;
let billingEmail, billingCC, billingExp, billingCvc;
let historyToggleBtn, historyDrawer, historyOverlay, historyCloseBtn, historyContainer;

document.addEventListener("DOMContentLoaded", () => {
  initElements();
  loadLocalStorage();
  bindEvents();
  renderHistory();
});

/**
 * Locate DOM elements
 */
function initElements() {
  dropzone = document.getElementById("resume-dropzone");
  fileSelector = document.getElementById("btn-select-file");
  fileInput = document.getElementById("input-resume-file");
  fileCard = document.getElementById("file-selected-card");
  fileNameLabel = document.getElementById("selected-file-name");
  fileSizeLabel = document.getElementById("selected-file-size");
  fileRemoveBtn = document.getElementById("btn-remove-file");

  roleSelect = document.getElementById("select-role");
  jdTextarea = document.getElementById("textarea-jd");
  roastBtn = document.getElementById("btn-roast-trigger");
  backBtn = document.getElementById("btn-back-home");

  apiSection = document.getElementById("api-config-section");
  apiToggleBtn = document.getElementById("btn-api-toggle");
  saveKeyBtn = document.getElementById("btn-save-key");
  clearKeyBtn = document.getElementById("btn-clear-key");
  apiKeyInput = document.getElementById("input-api-key");
  apiStatusLabel = document.getElementById("api-status-label");

  premiumIndicator = document.getElementById("premium-status-indicator");
  paywallOverlay = document.getElementById("results-paywall-overlay");
  premiumContainer = document.getElementById("premium-locked-content");
  unlockPaywallBtn = document.getElementById("btn-trigger-paywall");

  modalPayment = document.getElementById("modal-payment-overlay");
  billingCloseBtn = document.getElementById("btn-billing-close");
  billingSubmitBtn = document.getElementById("btn-billing-submit");
  billingDoneBtn = document.getElementById("btn-billing-done");
  
  billingEmail = document.getElementById("billing-email");
  billingCC = document.getElementById("billing-cc-num");
  billingExp = document.getElementById("billing-cc-exp");
  billingCvc = document.getElementById("billing-cc-cvc");

  historyToggleBtn = document.getElementById("btn-history-toggle");
  historyDrawer = document.getElementById("history-drawer");
  historyOverlay = document.getElementById("history-drawer-overlay");
  historyCloseBtn = document.getElementById("btn-history-close");
  historyContainer = document.getElementById("history-items-container");
}

/**
 * Load settings from localStorage
 */
function loadLocalStorage() {
  // Load API Key
  state.apiKey = localStorage.getItem("resumeroast_api_key") || "";
  if (state.apiKey) {
    apiKeyInput.value = state.apiKey;
    apiStatusLabel.textContent = "OpenAI Key Configured";
    apiToggleBtn.classList.add("active");
  } else {
    apiStatusLabel.textContent = "Configure OpenAI Key";
    apiToggleBtn.classList.remove("active");
  }

  // Load Pro Status
  state.isPro = localStorage.getItem("resumeroast_pro") === "true";
  updatePremiumUI();

  // Load Roast History
  const storedHistory = localStorage.getItem("resumeroast_history");
  if (storedHistory) {
    try {
      state.history = JSON.parse(storedHistory);
    } catch (e) {
      state.history = [];
    }
  }
}

/**
 * Update the user status badge & paywall classes
 */
function updatePremiumUI() {
  if (state.isPro) {
    premiumIndicator.classList.add("pro");
    premiumIndicator.querySelector(".status-lbl").textContent = "Pro Tier";
    paywallOverlay.classList.add("disabled");
    premiumContainer.parentElement.classList.remove("locked");
  } else {
    premiumIndicator.classList.remove("pro");
    premiumIndicator.querySelector(".status-lbl").textContent = "Free Tier";
    paywallOverlay.classList.remove("disabled");
    premiumContainer.parentElement.classList.add("locked");
  }
}

/**
 * Setup Event Listeners
 */
function bindEvents() {
  // Brand Click loads home
  document.getElementById("btn-brand").addEventListener("click", () => navigateTo('view-home'));

  // Toggle API config drawer
  apiToggleBtn.addEventListener("click", () => {
    apiSection.classList.toggle("active");
  });

  // Save API Key
  saveKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (key.length > 0) {
      state.apiKey = key;
      localStorage.setItem("resumeroast_api_key", key);
      apiStatusLabel.textContent = "OpenAI Key Configured";
      apiToggleBtn.classList.add("active");
      apiSection.classList.remove("active");
      showNotification("API key saved successfully!", "cyan");
    } else {
      showNotification("Please enter a valid API key.", "red");
    }
  });

  // Clear API Key
  clearKeyBtn.addEventListener("click", () => {
    state.apiKey = "";
    apiKeyInput.value = "";
    localStorage.removeItem("resumeroast_api_key");
    apiStatusLabel.textContent = "Configure OpenAI Key";
    apiToggleBtn.classList.remove("active");
    showNotification("API key removed.", "orange");
  });

  // File Select Triggers
  fileSelector.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  
  dropzone.addEventListener("click", () => {
    if (!state.selectedFile) {
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", handleFileSelection);

  // Drag and Drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Remove File
  fileRemoveBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    clearSelectedFile();
  });

  // Roast Resume Click
  roastBtn.addEventListener("click", startRoastingFlow);

  // Back Button
  backBtn.addEventListener("click", () => navigateTo('view-home'));

  // Paywall Checkout Dialog triggers
  unlockPaywallBtn.addEventListener("click", () => {
    showBillingModal(true);
  });
  billingCloseBtn.addEventListener("click", () => {
    showBillingModal(false);
  });

  // Billing credit card formatters
  billingCC.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = value.match(/.{1,4}/g);
    e.target.value = formatted ? formatted.join(' ') : '';
  });

  billingExp.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
    } else {
      e.target.value = value;
    }
  });

  billingCvc.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
  });

  // Billing submit simulation
  billingSubmitBtn.addEventListener("click", handlePaymentSubmission);

  // Payment completed done action
  billingDoneBtn.addEventListener("click", () => {
    state.isPro = true;
    localStorage.setItem("resumeroast_pro", "true");
    updatePremiumUI();
    showBillingModal(false);
    showNotification("Full Premium Report unlocked!", "cyan");
  });

  // History slide drawer events
  historyToggleBtn.addEventListener("click", toggleHistoryDrawer);
  historyOverlay.addEventListener("click", toggleHistoryDrawer);
  historyCloseBtn.addEventListener("click", toggleHistoryDrawer);
}

/**
 * Handle input file event
 */
function handleFileSelection(e) {
  const files = e.target.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

/**
 * Validate and render selected file
 */
function handleFile(file) {
  if (file.type !== "application/pdf") {
    showNotification("Please upload a PDF file only.", "red");
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showNotification("File size exceeds 5MB limit.", "red");
    return;
  }

  state.selectedFile = file;
  fileNameLabel.textContent = file.name;
  fileSizeLabel.textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";
  fileCard.classList.add("active");
  roastBtn.classList.remove("disabled");
  roastBtn.disabled = false;
}

/**
 * Clear current selected file
 */
function clearSelectedFile() {
  state.selectedFile = null;
  fileInput.value = "";
  fileCard.classList.remove("active");
  roastBtn.classList.add("disabled");
  roastBtn.disabled = true;
}

/**
 * Switch page views
 */
function navigateTo(viewId) {
  state.activeView = viewId;
  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.remove("active-view");
  });
  document.getElementById(viewId).classList.add("active-view");
  window.scrollTo(0, 0);
}

/**
 * Core Orchestrator: PDF text extraction -> API/Heuristic roaster -> dashboard mapping
 */
async function startRoastingFlow() {
  if (!state.selectedFile) return;

  navigateTo('view-loading');
  
  // Setup loading quote cycler
  let quoteIndex = 0;
  const quoteText = document.getElementById("loading-quote-text");
  quoteText.textContent = ROAST_QUOTES[0];
  
  const quoteInterval = setInterval(() => {
    quoteIndex = (quoteIndex + 1) % ROAST_QUOTES.length;
    quoteText.textContent = ROAST_QUOTES[quoteIndex];
  }, 2200);

  // Setup artificial progress bar (moving with text extraction)
  const fillBar = document.getElementById("roast-progress-fill");
  const percentText = document.getElementById("roast-progress-percent");
  
  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 60) {
      progress += Math.floor(Math.random() * 8) + 2;
      updateProgressBar(progress, fillBar, percentText);
    }
  }, 400);

  try {
    // 1. Read file to buffer
    const arrayBuffer = await readFileAsArrayBuffer(state.selectedFile);
    
    // 2. Perform PDF text extraction
    progress = 70;
    updateProgressBar(progress, fillBar, percentText);
    const extractedText = await extractTextFromPDF(arrayBuffer);
    state.extractedText = extractedText;

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("Unable to extract text from this PDF. Please verify it is not scanned/image-only.");
    }

    // 3. Process analysis
    progress = 85;
    updateProgressBar(progress, fillBar, percentText);
    
    const role = roleSelect.value;
    const jd = jdTextarea.value;
    const result = await analyzeResume(extractedText, role, jd, state.apiKey);
    
    // 4. Save completed result to state
    state.currentRoastData = result;

    progress = 100;
    updateProgressBar(progress, fillBar, percentText);
    await delay(600); // smooth transition

    // Clear intervals
    clearInterval(quoteInterval);
    clearInterval(progressInterval);

    // 5. Save to history list
    saveToHistory(state.selectedFile.name, role, result);
    
    // 6. Map parsed data to dashboard UI & navigate
    populateDashboard(state.selectedFile.name, role, result);
    navigateTo('view-results');

  } catch (error) {
    clearInterval(quoteInterval);
    clearInterval(progressInterval);
    navigateTo('view-home');
    showNotification(`Roast Failed: ${error.message}`, "red");
  }
}

function updateProgressBar(val, bar, text) {
  val = Math.min(100, val);
  bar.style.width = `${val}%`;
  text.textContent = `${val}%`;
}

/**
 * File reader helper
 */
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("File reading error."));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract text from PDF using PDF.js CDN library loaded dynamically
 */
async function extractTextFromPDF(arrayBuffer) {
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

/**
 * Save current roasted payload to browser local storage history
 */
function saveToHistory(fileName, role, result) {
  const newEntry = {
    id: Date.now(),
    fileName: fileName,
    role: role,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    score: result.score,
    data: result
  };

  // Prepend to list
  state.history.unshift(newEntry);
  
  // Cap at 10 items to prevent filling local storage
  if (state.history.length > 10) {
    state.history.pop();
  }

  localStorage.setItem("resumeroast_history", JSON.stringify(state.history));
  renderHistory();
}

/**
 * Populate all results card fields inside results page dashboard view
 */
function populateDashboard(fileName, role, result) {
  // Header details
  document.getElementById("results-role-badge").textContent = role;
  document.getElementById("results-date-stamp").textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Score circular progress ring animation setup
  const scoreRing = document.getElementById("results-score-ring");
  const scoreValText = document.getElementById("results-score-value");
  
  // Reset ring to 0
  scoreRing.style.strokeDashoffset = SCORE_CIRCUMFERENCE;
  scoreValText.textContent = "0";

  // Trigger score counting up animation & ring filling
  setTimeout(() => {
    // Fill circle
    const offset = SCORE_CIRCUMFERENCE - (result.score / 100) * SCORE_CIRCUMFERENCE;
    scoreRing.style.strokeDashoffset = offset;

    // Number counting up ticker
    let currentCount = 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    function updateCount(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      currentCount = Math.floor(progress * result.score);
      scoreValText.textContent = currentCount;

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        scoreValText.textContent = result.score;
      }
    }
    requestAnimationFrame(updateCount);
  }, 200);

  // Set Tone commentary & Roast Meter title
  const meterTitle = document.getElementById("roast-meter-title");
  const meterText = document.getElementById("roast-meter-text");
  
  if (result.score < 40) {
    meterTitle.textContent = "Soggy Toast 🍞";
    meterText.textContent = "This resume wouldn't trigger a smoke detector, let alone a recruiter. It's soggy, damp, and completely lacks metric impact.";
  } else if (result.score < 60) {
    meterTitle.textContent = "Burnt Around the Edges 🌋";
    meterText.textContent = "You've got some decent raw materials, but you've scorched it with dry templates, buzzwords, and spacing layout issues.";
  } else if (result.score < 80) {
    meterTitle.textContent = "Perfect Golden Crisp 🥐";
    meterText.textContent = "Not bad! Smells like a fresh croissant. Injecting stronger action verbs and fixing keywords will get you an interview.";
  } else {
    meterTitle.textContent = "Charred to Perfection 🔥";
    meterText.textContent = "Absolute fire! Your resume is crisp, robust, and packed with metric-driven accomplishments. Recruiter inbox alerts incoming!";
  }

  // Populate Summary issues
  const summaryIssuesList = document.getElementById("results-summary-issues");
  summaryIssuesList.innerHTML = "";
  result.summary_issues.forEach(issue => {
    const li = document.createElement("li");
    li.textContent = issue;
    summaryIssuesList.appendChild(li);
  });

  // Populate Missing keywords tags
  const keywordsContainer = document.getElementById("results-missing-keywords");
  keywordsContainer.innerHTML = "";
  if (result.missing_keywords && result.missing_keywords.length > 0) {
    result.missing_keywords.forEach(kw => {
      const tag = document.createElement("span");
      tag.className = "keyword-tag";
      tag.innerHTML = `<span class="keyword-tag-dot"></span>${kw}`;
      keywordsContainer.appendChild(tag);
    });
  } else {
    keywordsContainer.innerHTML = `<p class="sub-text">Incredible! No high-impact industry terms are missing.</p>`;
  }

  // Populate ATS suggestions list
  const atsList = document.getElementById("results-ats-feedback");
  atsList.innerHTML = "";
  result.ats_feedback.forEach(tip => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="ats-status-icon">⚠️</span><span>${tip}</span>`;
    atsList.appendChild(li);
  });

  // Populate premium bullet rewrites with detailed Problem, Fix, and Impact explanation blocks
  const bulletsContainer = document.getElementById("results-improved-bullets");
  bulletsContainer.innerHTML = "";
  result.improved_bullets.forEach(b => {
    const item = document.createElement("div");
    item.className = "bullet-item-rewrite";
    
    // Check if we have detailed explanation elements (problem/fix/impact), otherwise fall back to generic explanation
    const hasDetails = b.problem || b.fix || b.impact;
    let explanationHTML = "";
    
    if (hasDetails) {
      explanationHTML = `
        <div class="improvement-explanation-detailed">
          <div class="explanation-segment">
            <span class="segment-icon">🔴</span>
            <div class="segment-content">
              <strong>Critical Issue:</strong>
              <p>${b.problem || 'Weak phrasing and passive action tone.'}</p>
            </div>
          </div>
          <div class="explanation-segment">
            <span class="segment-icon">🟢</span>
            <div class="segment-content">
              <strong>The Reconstruction:</strong>
              <p>${b.fix || 'Injected a high-performance verb and quantified accomplishment scale.'}</p>
            </div>
          </div>
          <div class="explanation-segment">
            <span class="segment-icon">⚡</span>
            <div class="segment-content">
              <strong>Recruiter & ATS Impact:</strong>
              <p>${b.impact || 'ATS parsers successfully crawl and index specific technical metrics.'}</p>
            </div>
          </div>
        </div>
      `;
    } else {
      explanationHTML = `
        <div class="improvement-explanation">
          <span class="explanation-bulb">💡</span>
          <span>${b.explanation || 'Analyzed and improved verb and metrics.'}</span>
        </div>
      `;
    }

    item.innerHTML = `
      <div class="rewrite-comparison-block">
        <div class="version-box before-box">
          <span class="version-lbl">Before</span>
          <p class="version-text">"${b.original}"</p>
        </div>
        <div class="version-box after-box">
          <span class="version-lbl">After (Scorched)</span>
          <p class="version-text">"${b.improved}"</p>
        </div>
      </div>
      ${explanationHTML}
    `;
    bulletsContainer.appendChild(item);
  });
}

/**
 * Handle Stripe Payment checkout slide transitions
 */
function showBillingModal(show) {
  if (show) {
    // Reset modal slide visibility
    document.querySelectorAll(".billing-slide").forEach(s => s.classList.remove("active-slide"));
    document.getElementById("billing-slide-checkout").classList.add("active-slide");
    modalPayment.classList.add("active");
  } else {
    modalPayment.classList.remove("active");
  }
}

/**
 * Billing checkout submit callback simulation
 */
function handlePaymentSubmission() {
  const email = billingEmail.value.trim();
  const cc = billingCC.value.trim();
  const exp = billingExp.value.trim();
  const cvc = billingCvc.value.trim();

  if (!email || cc.length < 15 || exp.length < 5 || cvc.length < 3) {
    showNotification("Please fill in valid mockup card details.", "red");
    return;
  }

  // Go to Loading slide
  document.getElementById("billing-slide-checkout").classList.remove("active-slide");
  document.getElementById("billing-slide-loading").classList.add("active-slide");

  // Mock server roundtrip delay
  setTimeout(() => {
    document.getElementById("billing-slide-loading").classList.remove("active-slide");
    document.getElementById("billing-slide-success").classList.add("active-slide");
  }, 2500);
}

/**
 * Render history items list inside the overlay drawer
 */
function renderHistory() {
  historyContainer.innerHTML = "";
  
  if (state.history.length === 0) {
    historyContainer.innerHTML = `
      <div class="no-history-view">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <p>No past resume reviews found. Upload your first PDF to ignite your roast history!</p>
      </div>
    `;
    return;
  }

  state.history.forEach(item => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `
      <div class="history-card-meta">
        <span class="history-card-title">${item.fileName}</span>
        <span class="history-card-sub">${item.role} • ${item.date}</span>
      </div>
      <div class="history-card-score">${item.score}</div>
    `;
    
    // Load historical roast into dashboard when clicked
    card.addEventListener("click", () => {
      state.currentRoastData = item.data;
      populateDashboard(item.fileName, item.role, item.data);
      navigateTo('view-results');
      toggleHistoryDrawer();
    });

    historyContainer.appendChild(card);
  });
}

function toggleHistoryDrawer() {
  historyDrawer.classList.toggle("active");
  historyOverlay.classList.toggle("active");
}

/**
 * Simple notifications helper
 */
function showNotification(msg, theme = 'cyan') {
  const notif = document.createElement("div");
  notif.style.position = "fixed";
  notif.style.bottom = "24px";
  notif.style.right = "24px";
  notif.style.zIndex = "999";
  notif.style.padding = "1rem 1.5rem";
  notif.style.borderRadius = "8px";
  notif.style.fontFamily = "var(--font-family-body)";
  notif.style.fontSize = "0.9rem";
  notif.style.fontWeight = "600";
  notif.style.boxShadow = "0 8px 30px rgba(0,0,0,0.5)";
  notif.style.backdropFilter = "blur(12px)";
  notif.style.border = "1px solid";
  notif.style.opacity = "0";
  notif.style.transform = "translateY(10px)";
  notif.style.transition = "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";

  if (theme === 'red') {
    notif.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
    notif.style.borderColor = "rgba(239, 68, 68, 0.4)";
    notif.style.color = "#f87171";
  } else if (theme === 'orange') {
    notif.style.backgroundColor = "rgba(249, 115, 22, 0.15)";
    notif.style.borderColor = "rgba(249, 115, 22, 0.4)";
    notif.style.color = "#fb923c";
  } else {
    notif.style.backgroundColor = "rgba(6, 182, 212, 0.15)";
    notif.style.borderColor = "rgba(6, 182, 212, 0.4)";
    notif.style.color = "#22d3ee";
  }

  document.body.appendChild(notif);
  notif.textContent = msg;

  // trigger animation
  setTimeout(() => {
    notif.style.opacity = "1";
    notif.style.transform = "translateY(0)";
  }, 50);

  // remove after 3.5s
  setTimeout(() => {
    notif.style.opacity = "0";
    notif.style.transform = "translateY(10px)";
    setTimeout(() => notif.remove(), 300);
  }, 3500);
}

// Utility delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

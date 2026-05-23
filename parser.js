/**
 * ResumeRoast AI — Parser & Roaster Engine
 * 
 * Provides:
 * 1. A highly sophisticated local parsing engine for "Demo Mode" that scans text, 
 *    detects links, sections, word counts, and applies customized keyword checks
 *    based on the selected target professional role and job description.
 * 2. An official OpenAI API connector that calls Chat Completions securely using the user's API Key.
 */

// Role-based Keyword Database
const ROLE_KEYWORDS = {
  "Software Engineer": [
    "react", "node.js", "system design", "kubernetes", "typescript", 
    "aws", "docker", "graphql", "ci/cd", "algorithms", "database design", 
    "microservices", "java", "python", "git", "rest api"
  ],
  "Product Manager": [
    "roadmap", "agile", "user stories", "okrs", "product vision", 
    "a/b testing", "sql", "metrics", "stakeholder management", 
    "product launch", "scrum", "user research", "analytics", "backlog"
  ],
  "Data Scientist": [
    "python", "machine learning", "pytorch", "pandas", "sql", 
    "tensorflow", "scikit-learn", "statistics", "regression", 
    "data visualization", "tableau", "spark", "jupyter", "nlp"
  ],
  "UX Designer": [
    "wireframes", "prototyping", "figma", "user research", 
    "information architecture", "usability testing", "design systems", 
    "interaction design", "personas", "adobe xd", "user flows"
  ],
  "Marketing Specialist": [
    "seo", "sem", "google analytics", "copywriting", "conversion rate", 
    "funnel metrics", "a/b testing", "email marketing", "brand strategy", 
    "paid ads", "campaigns", "roi", "social media"
  ],
  "Financial Analyst": [
    "financial modeling", "excel", "valuation", "dcf", "forecasting", 
    "sql", "power bi", "risk assessment", "portfolio management", 
    "quarterly reports", "cfa", "vba", "accounting"
  ]
};

// Role-based Custom Bullet point rewrites with ultra-detailed Problem, Fix, and Impact analysis
const ROLE_BULLETS = {
  "Software Engineer": [
    {
      original: "Responsible for fixing bugs in the React web application.",
      improved: "Resolved 45+ critical application bottlenecks, improving core React page-load speed by 34% and reducing user drop-off.",
      problem: "Passive verb usage ('Responsible for') and lazy task listing. Completely hides your individual agency, technical ownership, and actual accomplishments.",
      fix: "Reconstructed with a high-impact action verb ('Resolved') and injected clear, specific metrics indicating speed optimization (34% page-load speedup) and volume scope (45+ critical bottlenecks).",
      impact: "ATS algorithms automatically prioritize resumes containing standard action verbs and specific scale parameters. Recruiters can instantly evaluate your capacity for performance optimization and user experience preservation."
    },
    {
      original: "Helped write backend APIs in Node.js.",
      improved: "Designed and engineered 12 microservice endpoints in Node.js and TypeScript, supporting 10k+ concurrent active users with 99.9% uptime.",
      problem: "Weak collaboration terms ('Helped write') reduce your perceived software contributions and authority. Fails to define the production scope or system complexity.",
      fix: "Upgraded to precise software architecture verbs ('Designed and engineered'), specified the system nature ('12 microservice endpoints'), and declared strict production traffic and SLA targets (10k+ users, 99.9% uptime).",
      impact: "Proves system design competency and production-level infrastructure ownership. High traffic and high availability statistics reassure engineering leads that you can write scalable code under load."
    },
    {
      original: "Worked in a team to deploy AWS infrastructure.",
      improved: "Co-architected automated CI/CD pipeline on AWS using Docker, reducing deployment times by 40% and cutting manual errors.",
      problem: "Extremely generic description ('Worked in a team'). It completely fails to articulate your technical actions or specify what tools you configured.",
      fix: "Delineated specific role ('Co-architected'), named infrastructure automation tools ('CI/CD pipeline', 'Docker', 'AWS'), and highlighted measurable time efficiency (40% build deployment speedup).",
      impact: "Demonstrates modern DevOps proficiency and infrastructure automation capabilities, showing you actively save developer hours and minimize production deployment failures."
    }
  ],
  "Product Manager": [
    {
      original: "Led the product team and worked on the product roadmap.",
      improved: "Spearheaded high-priority SaaS lifecycle roadmap, accelerating overall feature release velocity by 25% across two sprint teams.",
      problem: "Clunky verbs ('Led', 'Worked on') sound standard and administrative. Offers no business insight into roadmap size or feature launch efficiency.",
      fix: "Converted to premium management verbs ('Spearheaded'), identified product class ('SaaS lifecycle roadmap'), and added precise operational speedup statistics (25% feature release velocity increment across 2 sprint teams).",
      impact: "Demonstrates high-impact product leadership and cross-functional velocity optimization. Highlights your capability to drive real engineering sprint results, not just draw timelines."
    },
    {
      original: "Talked to customers and wrote user stories in Jira.",
      improved: "Conducted 30+ structured customer research interviews, translating qualitative insights into high-impact product OKRs that grew engagement 12%.",
      problem: "Sounds like basic task execution and administrative work. Jira is just a tool, not an accomplishment.",
      fix: "Quantified the user research scope ('30+ structured customer interviews'), proved analytical outcomes ('translating qualitative insights into product OKRs'), and proved business conversion growth ('grew engagement 12%').",
      impact: "Showcases data-driven product management thinking. Proves you can listen to customer needs and translate them into measurable strategic growth, rather than just acting as a task writer."
    }
  ],
  "Data Scientist": [
    {
      original: "Built models in Python to predict quarterly sales numbers.",
      improved: "Developed and deployed XGBoost regression models in Python, improving sales forecast accuracy by 18% and optimizing inventory budgets.",
      problem: "Lacks algorithmic details and business alignment. Simply saying 'built models' sounds like a student class project.",
      fix: "Specified algorithm class ('XGBoost regression models'), named programming framework ('Python'), and defined a strong financial metric alignment ('improving forecast accuracy by 18%', 'optimizing inventory budgets').",
      impact: "Signals deep machine learning engineering capabilities. Proves you can build production-ready ML systems that solve real business forecasting challenges."
    },
    {
      original: "Cleaned data and made dashboard reports.",
      improved: "Engineered automated data preprocessing pipelines in Apache Spark, cutting interactive dashboard latency from 45s to <2s.",
      problem: "Extremely junior-sounding tasks ('Cleaned data', 'Made reports'). Sounds like manual labor instead of engineering.",
      fix: "Upgraded to high-level engineering terms ('Engineered automated data preprocessing pipelines'), named the big data stack ('Apache Spark'), and quantified extreme latency reduction metrics (cutting latency from 45s to <2s).",
      impact: "Validates backend big data processing skills. Demonstrates you can scale database queries, replace manual reporting overhead, and improve application query performance."
    }
  ],
  "UX Designer": [
    {
      original: "Did wireframes and Figma designs for a mobile app project.",
      improved: "Designed end-to-end interactive wireframes in Figma, raising checkout flow completion rate by 22% during usability testing.",
      problem: "Highly routine task list ('Did wireframes'). Fails to connect UI changes with user behaviors or conversion objectives.",
      fix: "Described full design ownership ('end-to-end interactive wireframes'), named industry standard UI tools ('Figma'), and quantified user conversion metrics ('raising checkout completion by 22%').",
      impact: "Demonstrates conversion-driven design thinking, proving you design interfaces that improve real business objectives and digital sales, rather than just drawing buttons."
    },
    {
      original: "Conducted testing on users and wrote recommendations.",
      improved: "Facilitated 15 usability testing sessions, reducing user navigation friction by 40% through rapid iteration.",
      problem: "Fails to specify scale, testing methodologies, or how design feedback was actioned.",
      fix: "Quantified research actions ('15 usability testing sessions'), proved friction reduction metrics ('reducing user navigation friction by 40%'), and highlighted agile processes ('rapid iterations').",
      impact: "Validates research credentials. Reassures design leads that your UX iterations are backed by structured testing data rather than simple personal assumptions."
    }
  ],
  "Marketing Specialist": [
    {
      original: "Managed social media ads and Google AdWords campaigns.",
      improved: "Optimized paid acquisition search and social campaigns, lowering Customer Acquisition Cost (CAC) by 18% and scaling budget ROAS to 3.2x.",
      problem: "Generic administrative description. Fails to mention marketing metrics or prove budget efficiency.",
      fix: "Converted to acquisition metrics ('Optimized paid search and social campaigns'), and injected core marketing indicators ('lowering CAC by 18%', 'scaling ROAS to 3.2x').",
      impact: "Validates growth marketing capabilities. Shows you manage company capital efficiently, maximizing customer acquisition returns while cutting marketing wastes."
    },
    {
      original: "Sent out weekly email newsletters.",
      improved: "Overhauled segmentation logic for 80k subscriber list, boosting click-through rates (CTR) by 45% and conversion revenue.",
      problem: "Sounds like simple routine calendar management. Anyone can click 'Send' in Mailchimp.",
      fix: "Highlighted advanced database capabilities ('Overhauled segmentation logic for 80k list') and declared significant campaign metrics ('boosting click-through rates by 45%').",
      impact: "Proves deep email marketing automation knowledge. Demonstrates your capacity to handle massive client lists and drive direct revenue growth from standard newsletters."
    }
  ],
  "Financial Analyst": [
    {
      original: "Helped senior team members with financial modeling in Excel.",
      improved: "Constructed dynamic DCF financial models in Excel, forecasting quarterly revenue with <2% variance for a $5M portfolio.",
      problem: "Extremely auxiliary description ('Helped senior team members'). Suggests minor administrative work and lacks method details.",
      fix: "Upgraded to high-value modeling definitions ('Constructed dynamic DCF financial models'), named analytical software ('Excel'), and declared statistical accuracy parameters ('<2% variance for $5M portfolio').",
      impact: "Demonstrates sophisticated financial intelligence and statistical modeling confidence, showing you can build reliable corporate forecasts autonomously."
    },
    {
      original: "Wrote monthly expense reports for the division.",
      improved: "Automated standard divisional expense reporting via VBA and Power BI, saving 12 hours of manual processing time per month.",
      problem: "Sounds like boring manual copying and sorting of expenses.",
      fix: "Delineated workflow automation tools ('VBA', 'Power BI') and quantified exact monthly time-saving metrics ('saving 12 hours of manual processing time per month').",
      impact: "Signals high-level corporate efficiency. Hiring managers love candidates who save labor overhead by replacing standard reporting cycles with automated dashboards."
    }
  ]
};

// Stop words to filter from Job Descriptions during simple keyword extraction
const STOP_WORDS = new Set([
  'the', 'a', 'to', 'in', 'of', 'and', 'for', 'with', 'on', 'at', 'by', 'from',
  'an', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'do',
  'does', 'did', 'but', 'or', 'as', 'if', 'this', 'that', 'these', 'those',
  'we', 'you', 'he', 'she', 'they', 'our', 'their', 'your', 'my', 'me', 'us',
  'about', 'above', 'after', 'again', 'against', 'all', 'am', 'any', 'because',
  'can', 'could', 'few', 'more', 'most', 'no', 'nor', 'not', 'only', 'other',
  'our', 'out', 'over', 'same', 'should', 'so', 'some', 'such', 'than', 'then',
  'too', 'very', 'will', 'would', 'should', 'into', 'upon', 'about', 'using',
  'role', 'responsibilities', 'requirements', 'skills', 'experience', 'ability',
  'candidate', 'team', 'work', 'job', 'description', 'position', 'duties'
]);

/**
 * Main Controller: Analyze the resume. Choice between local parsing and OpenAI.
 */
async function analyzeResume(text, role, jobDescription, apiKey) {
  if (apiKey && apiKey.trim().length > 10) {
    return await analyzeWithOpenAI(text, role, jobDescription, apiKey);
  } else {
    return analyzeLocally(text, role, jobDescription);
  }
}

/**
 * Local Parsing Engine Heuristic
 */
function analyzeLocally(text, role, jobDescription) {
  const normalizedText = text.toLowerCase();
  
  // 1. Check sections
  const sections = {
    experience: /experience|work history|employment|history/i.test(text),
    education: /education|degree|university|college/i.test(text),
    skills: /skills|technologies|proficiencies|expertise/i.test(text),
    projects: /projects|portfolio|accomplishments/i.test(text)
  };
  
  // 2. Check contact details
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\d{10}\b/.test(normalizedText) || /\+\d+/.test(normalizedText);
  const hasLinkedin = /linkedin\.com/i.test(text);
  const hasGithub = /github\.com/i.test(text);
  
  // 3. Word count metrics
  const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // 4. Strong vs Weak verbs & buzzwords
  const weakBuzzwords = [
    "responsible for", "assisted with", "helped to", "handled daily", 
    "detail-oriented", "team player", "motivated professional", "dynamic leader"
  ];
  const detectedWeakWords = weakBuzzwords.filter(word => normalizedText.includes(word));
  
  // 5. Hard metric check (numbers/percentages)
  const numbers = text.match(/\b\d+%\b|\$\d+([.,]\d+)?\b|\b\d+\s*(percent|dollars|million|billion|hours|years)\b/gi);
  const metricsCount = numbers ? numbers.length : 0;
  
  // --- Score calculation engine (out of 100) ---
  let score = 40; // baseline
  
  // Section points (up to 20 pts)
  let sectionScore = 0;
  if (sections.experience) sectionScore += 5;
  if (sections.education) sectionScore += 5;
  if (sections.skills) sectionScore += 5;
  if (sections.projects) sectionScore += 5;
  score += sectionScore;
  
  // Contact details points (up to 15 pts)
  let contactScore = 0;
  if (hasEmail) contactScore += 5;
  if (hasPhone) contactScore += 5;
  if (hasLinkedin) contactScore += 5;
  score += contactScore;
  
  // Word count constraint (up to 10 pts)
  if (wordCount >= 300 && wordCount <= 750) {
    score += 10;
  } else if (wordCount > 150 && wordCount < 1000) {
    score += 5;
  }
  
  // Metrics density boost (up to 15 pts)
  if (metricsCount >= 5) {
    score += 15;
  } else if (metricsCount >= 2) {
    score += 8;
  }
  
  // Weak words penalty (up to -20 pts)
  score -= (detectedWeakWords.length * 4);
  
  // Limit bounds
  score = Math.max(15, Math.min(94, Math.round(score))); // Local max is 94 to encourage paywall/polish!

  // --- Compile Summary Issues & Roast Comments ---
  const summary_issues = [];
  
  if (detectedWeakWords.length > 0) {
    summary_issues.push(`You used lazy buzzwords like "${detectedWeakWords[0]}". This sounds like you just clocked in, not that you actually built anything.`);
  }
  if (metricsCount < 3) {
    summary_issues.push("Your resume is severely nutrient-deficient in numbers. Recruiters want to see percentages, revenues, or time saved, not just a grocery list of tasks.");
  }
  if (wordCount < 250) {
    summary_issues.push(`Word count is dangerously low (${wordCount} words). Recruiters will think you spent more time formatting than working.`);
  } else if (wordCount > 900) {
    summary_issues.push(`Whoa, War and Peace! Your resume is ${wordCount} words long. Keep it under 2 pages or recruiters will use it as a sleep aid.`);
  }
  if (!sections.projects && (role === "Software Engineer" || role === "Data Scientist" || role === "UX Designer")) {
    summary_issues.push("No Portfolio or Projects section found! For tech roles, this is like showing up to an interview with empty hands.");
  }
  
  // Fallback defaults if resume is relatively neat
  if (summary_issues.length === 0) {
    summary_issues.push("Your formatting is decent, but your experience bullets lack punch and fail to highlight the concrete business scale you managed.");
    summary_issues.push("The introduction is filled with corporate-speak that doesn't articulate your unique value proposition.");
  }

  // --- Compile Missing Keywords ---
  const missing_keywords = [];
  const standardRoleKeywords = ROLE_KEYWORDS[role] || [];
  
  standardRoleKeywords.forEach(kw => {
    // simple boundary safe search
    const regex = new RegExp("\\b" + kw.replace(".", "\\.") + "\\b", "i");
    if (!regex.test(normalizedText)) {
      missing_keywords.push(kw);
    }
  });

  // Extract from pasted Job Description if supplied
  if (jobDescription && jobDescription.trim().length > 10) {
    const jdWords = jobDescription.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4 && !STOP_WORDS.has(w));
    
    // Sort words by frequency
    const wordFreq = {};
    jdWords.forEach(w => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
    
    const sortedJDKeywords = Object.keys(wordFreq).sort((a, b) => wordFreq[b] - wordFreq[a]);
    
    // Add top JD words that are not in the resume and not already listed
    let jdCountAdded = 0;
    for (let i = 0; i < sortedJDKeywords.length && jdCountAdded < 5; i++) {
      const kw = sortedJDKeywords[i];
      if (!normalizedText.includes(kw) && !missing_keywords.includes(kw) && !standardRoleKeywords.includes(kw)) {
        missing_keywords.push(kw);
        jdCountAdded++;
      }
    }
  }

  // Cap missing keywords list
  const final_missing_keywords = missing_keywords.slice(0, 8);

  // --- Compile ATS Feedback ---
  const ats_feedback = [];
  if (!hasEmail) {
    ats_feedback.push("Missing email address! Recruiters cannot hire a ghost.");
  }
  if (!hasPhone) {
    ats_feedback.push("No phone number found. Unless you only accept carrier pigeon invites, add a mobile number.");
  }
  if (!hasLinkedin) {
    ats_feedback.push("LinkedIn profile missing. In 2026, if you aren't on LinkedIn, corporate systems assume you do not exist.");
  }
  if (!hasGithub && (role === "Software Engineer" || role === "Data Scientist")) {
    ats_feedback.push("GitHub link missing. For dev positions, this is like showing up to a coding test without a keyboard.");
  }
  
  // General layout advice
  ats_feedback.push("Double-column layout warning! Typical ATS parsers parse double columns from left-to-right, blending different jobs together into a messy word salad.");
  ats_feedback.push("Avoid using styled graphics, text boxes, or percentage circles inside the PDF file. ATS machines completely skip them, leaving big blanks.");
  
  if (ats_feedback.length < 3) {
    ats_feedback.push("Ensure your section titles use standard terms (e.g., use 'Work Experience' instead of 'My Career Journey') so parsing robots categorize it correctly.");
  }

  // --- Bullet point rewrites ---
  const improved_bullets = ROLE_BULLETS[role] || ROLE_BULLETS["Software Engineer"];

  // Return standard structured payload
  return {
    score: score,
    summary_issues: summary_issues,
    missing_keywords: final_missing_keywords,
    ats_feedback: ats_feedback,
    improved_bullets: improved_bullets
  };
}

/**
 * OpenAI API Connector
 */
async function analyzeWithOpenAI(text, role, jobDescription, apiKey) {
  const prompt = `You are ResumeRoast AI, a brutal, witty, highly critical yet extremely helpful professional resume reviewer and ATS optimizer. You analyze resumes and roast them with sharp, comedic, yet deeply constructive feedback.
  
Analyze the following resume text.
Target Professional Role: ${role}
Target Job Description: ${jobDescription || 'None provided'}

Return a valid JSON object conforming exactly to this schema:
{
  "score": number (0-100, be strict, brutally realistic, and metrics-driven),
  "summary_issues": ["bullet 1 about general issues/roasts", "bullet 2..."],
  "missing_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "ats_feedback": ["ats format issue 1", "ats format issue 2..."],
  "improved_bullets": [
    {
      "original": "weak accomplishments from their resume",
      "improved": "beautifully rewritten bullet point with strong action verbs and metrics",
      "problem": "Detailed breakdown of the critical issue in the original bullet (e.g. passive verbs, missing metrics, lazy vocabulary)",
      "fix": "Technical explanation of the precise actions taken to reconstruct the bullet (action verbs, scale elements, technology inclusions)",
      "impact": "Explanation of how this change impacts ATS crawlers and hiring managers specifically"
    },
    {
      "original": "second weak bullet",
      "improved": "improved bullet point 2",
      "problem": "detailed issue",
      "fix": "precise optimization",
      "impact": "ATS/recruiter result"
    },
    {
      "original": "third weak bullet",
      "improved": "improved bullet point 3",
      "problem": "detailed issue",
      "fix": "precise optimization",
      "impact": "ATS/recruiter result"
    }
  ]
}

Make the roasts hilarious, sarcastic, yet extremely specific. In improved_bullets, draft realistic rewrites based on their text but with excellent verbs and plausible scale metrics.
IMPORTANT: Return ONLY the raw valid JSON. Do not wrap the output in markdown code blocks (\`\`\`json ... \`\`\`), do not include any explanatory prefix or suffix.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a professional resume reviewer returning structured JSON analysis." },
          { role: "user", content: prompt + "\n\nResume Text:\n" + text }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const resultString = data.choices[0].message.content.trim();
    const parsedData = JSON.parse(resultString);
    
    // Ensure all fields exist
    return {
      score: parsedData.score || 50,
      summary_issues: parsedData.summary_issues || ["Failed to generate deep critique summary."],
      missing_keywords: parsedData.missing_keywords || [],
      ats_feedback: parsedData.ats_feedback || ["Failed to generate ATS feedback details."],
      improved_bullets: parsedData.improved_bullets || []
    };
  } catch (error) {
    console.error("Error analyzing with OpenAI:", error);
    // Fall back to local parser with an extra warning so the user knows they fell back
    const fallback = analyzeLocally(text, role, jobDescription);
    fallback.summary_issues.unshift(`[API Connection Failed] We fell back to our advanced local analyzer: ${error.message}`);
    return fallback;
  }
}

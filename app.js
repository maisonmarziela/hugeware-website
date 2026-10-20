"use strict";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const storage = {
  get(key) { try { return localStorage.getItem(`hugeware:${key}`); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(`hugeware:${key}`, value); } catch {} }
};
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = storage.get("motion") === "reduce" || (storage.get("motion") !== "full" && motionQuery.matches);
const dialog = $("#content-dialog");
let lastFocus = null;
let toastTimer;
function notify(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}
function openDialog(content) {
  if (!dialog.open) lastFocus = document.activeElement;
  $("#dialog-content").innerHTML = content;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  const title = $("#dialog-title");
  title.setAttribute("tabindex","-1");
  title.focus({preventScroll:true});
}
function closeDialog() { dialog.close(); }
$(".close-dialog").addEventListener("click",closeDialog);
dialog.addEventListener("click",event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog();
});
dialog.addEventListener("close",()=>lastFocus?.focus({preventScroll:true}));
const menuButton=$(".menu-toggle");
function closeMenu(){
  menuButton.setAttribute("aria-expanded","false");$("#mobile-nav").hidden=true;
  $("span",menuButton).textContent="+";
}
menuButton.addEventListener("click",()=>{
  const open=menuButton.getAttribute("aria-expanded")!=="true";
  menuButton.setAttribute("aria-expanded",String(open));$("#mobile-nav").hidden=!open;
  $("span",menuButton).textContent=open?"−":"+";
});
$$(".mobile-nav a").forEach(link=>link.addEventListener("click",closeMenu));
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!$("#mobile-nav").hidden){closeMenu();menuButton.focus();}
});
matchMedia("(min-width: 761px)").addEventListener("change",event=>{if(event.matches)closeMenu();});
$("#year").textContent=new Date().getFullYear();
function updateMotion(){
  document.documentElement.classList.toggle("motion-reduced",reducedMotion);
  $("#motion-toggle").setAttribute("aria-pressed",String(reducedMotion));
  $("#motion-toggle").setAttribute("aria-label",reducedMotion?"Enable animations":"Pause animations");
  $("#motion-icon").textContent=reducedMotion?"▶":"Ⅱ";
  $("#motion-label").textContent=reducedMotion?"Play motion":"Pause motion";
  $("#footer-motion").textContent=reducedMotion?"Enable motion":"Reduce motion";
  document.dispatchEvent(new CustomEvent("hugeware:motion",{detail:{reduced:reducedMotion}}));
}
function toggleMotion(){reducedMotion=!reducedMotion;storage.set("motion",reducedMotion?"reduce":"full");updateMotion();}
$("#motion-toggle").addEventListener("click",toggleMotion);
$("#footer-motion").addEventListener("click",toggleMotion);
motionQuery.addEventListener("change",event=>{if(!storage.get("motion")){reducedMotion=event.matches;updateMotion();}});
updateMotion();
function downloadFile(name,content){
  const url=URL.createObjectURL(new Blob([content],{type:"text/plain;charset=utf-8"}));
  const anchor=document.createElement("a");anchor.href=url;anchor.download=name;
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}

const services={
  personal:{
    title:"Personal protection",eyebrow:"FOR PEOPLE",lede:"Your digital life deserves someone in its corner.",
    description:"Account access, device settings, privacy decisions. It can feel like a lot to keep up with. Our personal security offering is built around helping you understand what matters and take manageable steps to protect it.",
    scope:["Account and sign-in security","Device and home-network reviews","Privacy settings and recovery planning","Clear guidance for everyday decisions"],
    items:["Review how I protect my main email account","Set up stronger sign-ins and a password manager","Check updates and access on my devices","Make a plan for account recovery and backups"],
    source:"https://www.cisa.gov/secure-our-world",sourceLabel:"CISA: Secure Our World"
  },
  business:{
    title:"Business security",eyebrow:"FOR TEAMS & ORGANIZATIONS",lede:"Stronger foundations. From the first hire to the next horizon.",
    description:"Security needs to work with your business. Our approach brings technical review and practical prioritization together, whether you need to establish the basics or give an existing security team another perspective.",
    scope:["Security assessments with an agreed scope","Identity, access, and cloud configuration reviews","Prioritized remediation planning","Team awareness and recovery preparation"],
    items:["Identify the systems and data our team depends on","Review administrative access and sign-in protection","Assign owners for updates and security changes","Test recovery and clarify who responds to an incident"],
    source:"https://www.cisa.gov/small-and-medium-sized-business-resources",sourceLabel:"CISA: Business security resources"
  },
  response:{
    title:"Incident readiness",eyebrow:"BEFORE & AFTER AN INCIDENT",lede:"The moment to make a plan is before the pressure arrives.",
    description:"A useful response plan makes the next move clear. Think named responsibilities, trusted contacts, recovery priorities, and time to practice. When an incident happens, prepared people are part of the defense.",
    scope:["Response playbooks and escalation paths","Tabletop exercises for your team","Recovery planning and backup reviews","Post-incident learning and improvement"],
    items:["Agree who takes the lead during an incident","Keep trusted support contacts available","Identify critical services and recovery priorities","Practice the plan and update what we learn"],
    source:"https://www.cisa.gov/stopransomware/ransomware-guide",sourceLabel:"CISA: Incident preparation and response"
  }
};
const selectedPriorities={personal:new Set(),business:new Set(),response:new Set()};
function openService(id){
  const service=services[id];if(!service)return;
  openDialog(`<div class="dialog-body"><p class="eyebrow">${service.eyebrow}</p><h2 id="dialog-title">${service.title}</h2><p class="lede">${service.lede}</p><p>${service.description}</p><ul class="scope-list">${service.scope.map(item=>`<li>${item}</li>`).join("")}</ul><div class="checklist-panel"><div class="checklist-heading mono"><span>WHAT WOULD YOU LIKE TO WORK ON?</span><span id="checklist-count" role="status"></span></div>${service.items.map((item,index)=>`<label class="check-item"><input type="checkbox" data-priority="${index}" ${selectedPriorities[id].has(index)?"checked":""}><span>${item}</span></label>`).join("")}<div class="checklist-progress" aria-hidden="true"><span></span></div><p class="small-note">Choose topics for a conversation. This is a planning list, not a security test.</p><div class="dialog-actions"><button class="plain-button" id="download-checklist">Save this checklist ↗</button><button class="plain-button" id="reset-checklist">Reset choices</button></div></div><button class="button button-light" id="service-brief">Build a starting brief <span>↗</span></button><p class="small-note">Hugeware is a fictional corporation. These service concepts are not a live support service.</p><div class="article-source">For practical guidance: <a href="${service.source}" target="_blank" rel="noopener noreferrer">${service.sourceLabel} ↗</a></div></div>`);
  function updateChecklist(){
    const count=selectedPriorities[id].size;
    $("#checklist-count").textContent=`${count} of ${service.items.length} selected`;
    $(".checklist-progress span").style.width=`${count/service.items.length*100}%`;
  }
  $$("[data-priority]").forEach(input=>input.addEventListener("change",()=>{
    const index=Number(input.dataset.priority);
    if(input.checked)selectedPriorities[id].add(index);else selectedPriorities[id].delete(index);
    updateChecklist();
  }));
  $("#reset-checklist").addEventListener("click",()=>{selectedPriorities[id].clear();$$("[data-priority]").forEach(input=>input.checked=false);updateChecklist();});
  $("#download-checklist").addEventListener("click",()=>{
    const lines=service.items.map((item,index)=>`[${selectedPriorities[id].has(index)?"x":" "}] ${item}`);
    downloadFile(`hugeware-${id}-checklist.txt`,`HUGEWARE\n${service.title}\n\nTopics I want to discuss:\n${lines.join("\n")}\n\nThis is a planning checklist, not a security assessment.\nFurther reading: ${service.source}\n\nHugeware is a fictional brand concept. No request has been submitted.\n`);
    notify("Checklist downloaded. Nothing was submitted.");
  });
  $("#service-brief").addEventListener("click",()=>startBrief(id==="personal"?"personal":null));
  updateChecklist();
}
$$("[data-service]").forEach(button=>button.addEventListener("click",()=>openService(button.dataset.service)));

$$("[data-filter]").forEach(button=>button.addEventListener("click",()=>{
  const category=button.dataset.filter;
  $$("[data-filter]").forEach(control=>{const active=control===button;control.classList.toggle("active",active);control.setAttribute("aria-pressed",String(active));});
  $$(".journal-card").forEach(card=>{card.hidden=category!=="all"&&card.dataset.category!==category;if(!card.hidden)card.classList.add("is-visible");});
  const count=$$(".journal-card").filter(card=>!card.hidden).length;
  $(".filter-status").textContent=`Showing ${count} ${category==="all"?"":category+" "}field ${count===1?"note":"notes"}.`;
}));
const articles={
  accounts:{
    category:"PERSONAL SECURITY",title:"Your digital life.<br>A stronger front door.",lede:"Start with the accounts that connect everything else.",
    body:[
      ["Your email is a good place to begin.","Your main inbox often connects shopping, work, social accounts, and password recovery. Treating it as a priority makes the rest of your security plan easier to organize. Write down which accounts matter most before making changes, so nothing important gets lost in the process."],
      ["Give each account its own key.","Use strong, unique passwords and a password manager to help you keep track of them. Turn on multifactor authentication where it is available. These are practical foundations recommended by CISA, and they are a useful place to begin a conversation about account security."],
      ["Make recovery part of the setup.","As you review an account, look at its recovery options too. Use the service’s official instructions, understand where recovery information is kept, and think about what you would do if your usual device were unavailable. Don’t paste passwords or recovery codes into a planning document or an unfamiliar website."],
      ["A manageable routine beats a perfect intention.","Security is easier to maintain when it fits into your life. Give yourself a small task: one account review, one device update, one conversation with a family member about a suspicious message. The goal is progress you can keep up with, not a long list you never return to."],
      ["","You don’t need to know every technical term to ask a good question. “How do I get back in if this goes wrong?” is an excellent start."]
    ],source:"https://www.cisa.gov/secure-our-world",sourceLabel:"CISA — Secure Our World"
  },
  teams:{
    category:"BUSINESS SECURITY",title:"Good security<br>is a team sport.",lede:"The best plan is one people can understand, use, and keep up to date.",
    body:[
      ["Make ownership visible.","A shared responsibility still needs named owners. Who reviews access when someone joins or leaves? Who checks whether important systems are being updated? Who can make a decision when something looks wrong? Even a simple list is a stronger starting point than an assumption."],
      ["Begin with the foundations.","CISA’s business resources emphasize practical measures such as stronger authentication, software updates, and awareness of phishing. Before adding another tool, discuss how these basics work in your own environment and where responsibility sits."],
      ["Design for the ordinary day.","A process that only works when everyone has extra time will struggle when work gets busy. Make reporting straightforward. Keep instructions where people can find them. Explain why a change matters and what a colleague needs to do differently, rather than forwarding a technical notice without context."],
      ["Make it safe to ask.","People should be able to say “I clicked something unusual” or “I’m not sure this request is real” without having to diagnose the problem first. A useful reporting culture rewards early questions. It treats uncertainty as a reason to check, not a reason to stay quiet."],
      ["Keep the plan connected to the business.","A security review should end with priorities people can act on: an owner, a next step, and a reason. Review those choices when your team, systems, or business needs change. A plan is a working tool, not a document to file away."],
      ["","Whether you have three people or three thousand, clarity is part of the defense."]
    ],source:"https://www.cisa.gov/small-and-medium-sized-business-resources",sourceLabel:"CISA — Small and Medium-Sized Business Resources"
  },
  readiness:{
    category:"INCIDENT READINESS",title:"Write the plan.<br>Before you need it.",lede:"You don’t have to predict every incident to prepare for the first conversation.",
    body:[
      ["Start with who.","When something goes wrong, people need to know who is coordinating, who can authorize changes, and how to reach trusted help. Discuss those roles while you have time. Keep contact details available through a route that doesn’t depend entirely on the systems you might lose."],
      ["Decide what matters first.","Which services would you need to restore first? Which people depend on them? What information would help a qualified responder understand the situation? Those questions bring recovery planning back to its real purpose: helping people and operations continue."],
      ["Practice the conversation.","A tabletop exercise can be as simple as a team discussing an imagined incident. Walk through who notices the issue, where it is reported, who decides what happens next, and how the organization communicates. Note the unclear moments. Those are opportunities to improve the plan before it is needed."],
      ["Keep recovery realistic.","CISA’s ransomware guidance recommends maintaining backups and testing restoration. A recovery plan should account for both the data and the systems required to use it. Review these arrangements with the people who maintain them, and record what you learn from a test."],
      ["If something is happening now.","Use your organization’s incident procedure or a trusted provider’s official support channel. A general planning guide cannot diagnose a live incident. Avoid posting passwords, recovery codes, or sensitive incident details into public forms."],
      ["","Preparedness isn’t a promise that nothing will happen. It is a way of making the first decisions less uncertain."]
    ],source:"https://www.cisa.gov/stopransomware/ransomware-guide",sourceLabel:"CISA — #StopRansomware Guide"
  }
};
$$("[data-article]").forEach(button=>button.addEventListener("click",()=>{
  const article=articles[button.dataset.article];
  openDialog(`<article class="dialog-body"><p class="eyebrow">${article.category}</p><h2 id="dialog-title">${article.title}</h2><p class="lede">${article.lede}</p>${article.body.map(([heading,paragraph])=>`${heading?`<h3>${heading}</h3>`:""}<p>${paragraph}</p>`).join("")}<div class="article-source">Further reading: <a href="${article.source}" target="_blank" rel="noopener noreferrer">${article.sourceLabel} ↗</a><br>Hugeware editorial. General information, not an assessment of your systems.</div><button class="button button-outline" id="article-back">Back to field notes <span>↗</span></button></article>`);
  $("#article-back").addEventListener("click",closeDialog);
}));

const questions=[
  {title:"Who are we<br>looking out for?",hint:"Start with your world.",options:[["personal","Myself or my family"],["team","A small or growing team"],["organization","An established organization"]]},
  {title:"What’s on<br>your mind?",hint:"Choose the area you want to work on first.",options:[["access","Accounts and access"],["systems","Devices and systems"],["readiness","Preparing for an incident"]]},
  {title:"Where are you<br>starting from?",hint:"This helps put the next step in context.",options:[["starting","I’m getting the basics in place"],["reviewing","I want to review what’s already there"],["incident","Something may be wrong right now"]]}
];
const audienceNames={personal:"You and your family",team:"A small or growing team",organization:"An established organization"};
const priorityNames={access:"Accounts and access",systems:"Devices and systems",readiness:"Incident preparation"};
const situationNames={starting:"Establishing the basics",reviewing:"Reviewing existing protection",incident:"A possible active incident"};
const advice={
  personal:{
    access:["List your most important accounts, starting with your main email.","Review strong, unique passwords and available multifactor authentication.","Use each provider’s official guidance to review account recovery options."],
    systems:["List the devices you use and who can access them.","Check software updates and built-in security settings using official device guidance.","Review how you back up important files and how you would restore them."],
    readiness:["Identify the accounts and files you would need to recover first.","Keep trusted provider support and recovery information somewhere accessible.","Review backup and recovery steps before you need them."]
  },
  team:{
    access:["Identify your team’s critical accounts and their owners.","Review administrative access, multifactor authentication, and joiner/leaver procedures.","Agree which access changes need to happen first and who will make them."],
    systems:["Map the devices, cloud services, and business data your team relies on.","Assign responsibility for updates, configuration reviews, and access changes.","Review backup arrangements and schedule a recovery test."],
    readiness:["Name an incident lead and the trusted specialists they can contact.","Document critical services, reporting routes, and recovery priorities.","Practice a short incident scenario together and record the gaps."]
  },
  organization:{
    access:["Agree the scope of an identity and access review with your security team.","Review privileged access, authentication policies, and exceptions against your requirements.","Prioritize findings, assign owners, and define how improvements will be verified."],
    systems:["Agree which business services and infrastructure are in scope.","Review configuration, patch ownership, and recovery dependencies with the responsible teams.","Create a prioritized remediation plan with accountable owners and review dates."],
    readiness:["Review escalation, decision-making, and communication responsibilities.","Walk through recovery priorities and dependencies with relevant business owners.","Run a tabletop exercise and use the findings to update your response plan."]
  }
};
let briefStep=0,briefAnswers=[];
function startBrief(audience=null){
  briefAnswers=audience?[audience]:[];briefStep=audience?1:0;renderQuestion();
}
function renderQuestion(){
  const question=questions[briefStep];
  openDialog(`<div class="dialog-body"><p class="eyebrow">YOUR STARTING BRIEF · QUESTION ${briefStep+1} OF 3</p><div class="question-progress" aria-hidden="true">${questions.map((_,index)=>`<i class="${index<=briefStep?"done":""}"></i>`).join("")}</div><h2 id="dialog-title">${question.title}</h2><p class="lede">${question.hint}</p><div class="brief-options">${question.options.map(([value,label])=>`<button class="brief-option" data-answer="${value}">${label}<span aria-hidden="true">↗</span></button>`).join("")}</div>${briefStep?'<button class="text-link brief-back" id="brief-back">← Previous question</button>':""}<p class="small-note">No names, passwords, or system details needed. Nothing is submitted.</p></div>`);
  $$("[data-answer]").forEach(button=>button.addEventListener("click",()=>{
    briefAnswers[briefStep]=button.dataset.answer;
    briefStep++;if(briefStep<questions.length)renderQuestion();else showBrief();
  }));
  $("#brief-back")?.addEventListener("click",()=>{briefStep--;renderQuestion();});
}
function buildBrief(answers){
  const [audience,priority,situation]=answers;
  const isIncident=situation==="incident";
  const service=isIncident?"response":audience==="personal"?"personal":priority==="readiness"?"response":"business";
  let steps=[...advice[audience][priority]];
  if(situation==="reviewing")steps.push("Compare what is in place with your current needs and record unresolved questions.");
  if(isIncident)steps=[
    audience==="personal"?"Contact the affected service through its official support or account-recovery channel.":"Notify your security lead or designated incident contact through a trusted channel.",
    "Record what you observed and when, without sharing passwords, recovery codes, or sensitive data publicly.",
    "Follow your established response procedure or the instructions of a qualified responder."
  ];
  return {audience:audienceNames[audience],priority:priorityNames[priority],situation:situationNames[situation],service,isIncident,steps,
    title:isIncident?"Reach trusted help first.":audience==="personal"?"Start with your digital life.":"Start with what your team relies on.",
    summary:isIncident?"A possible active incident needs context and qualified support. This fictional site cannot investigate, monitor, or respond to an incident.":"A starting point for a useful conversation. These actions help organize your priorities; they are not a scan, diagnosis, or security rating."};
}
function showBrief(){
  const result=buildBrief(briefAnswers);
  const source=result.isIncident||briefAnswers[1]==="readiness"?services.response:briefAnswers[0]==="personal"?services.personal:services.business;
  openDialog(`<div class="dialog-body"><p class="eyebrow">YOUR STARTING BRIEF</p><h2 id="dialog-title">A clearer<br>next step.</h2><div class="brief-summary"><span class="mono">${result.audience.toUpperCase()} · ${result.priority.toUpperCase()}</span><h3>${result.title}</h3><p>${result.summary}</p></div><h3>Suggested next steps</h3><ol class="brief-priorities">${result.steps.map(step=>`<li>${step}</li>`).join("")}</ol><div class="dialog-actions"><button class="plain-button" id="save-brief">Download your brief ↗</button><button class="plain-button" id="restart-brief">Start again</button><button class="plain-button" id="edit-brief">Change last answer</button></div><button class="button button-outline" id="brief-service">Explore ${services[result.service].title.toLowerCase()} <span>↗</span></button><div class="article-source">Further reading: <a href="${source.source}" target="_blank" rel="noopener noreferrer">${source.sourceLabel} ↗</a><br>This brief stays in your browser. No support request has been sent.</div></div>`);
  $("#restart-brief").addEventListener("click",()=>startBrief());
  $("#edit-brief").addEventListener("click",()=>{briefStep=2;renderQuestion();});
  $("#brief-service").addEventListener("click",()=>openService(result.service));
  $("#save-brief").addEventListener("click",()=>{
    downloadFile("hugeware-security-brief.txt",`HUGEWARE\nfor consumers. by consumers.\n\nYOUR STARTING BRIEF\n\nFor: ${result.audience}\nFocus: ${result.priority}\nStarting point: ${result.situation}\n\n${result.title}\n${result.summary}\n\nSUGGESTED NEXT STEPS\n${result.steps.map((step,index)=>`${index+1}. ${step}`).join("\n\n")}\n\nFurther reading: ${source.source}\n\nHugeware is a fictional brand. This is a planning guide, not a security assessment or live incident service. No support request has been submitted.\n`);
    notify("Brief downloaded. No request was submitted.");
  });
}
$$("[data-start]").forEach(button=>button.addEventListener("click",()=>startBrief()));
$$("[data-info]").forEach(button=>button.addEventListener("click",()=>{
  if(button.dataset.info==="privacy")openDialog(`<div class="dialog-body"><p class="eyebrow">PRIVACY</p><h2 id="dialog-title">Less data.<br>More respect.</h2><p class="lede">The interactive tools run in your browser. They don’t ask for your credentials, inspect your device, or send your answers to Hugeware.</p><h3>What is stored</h3><p>Your motion preference uses browser local storage. Checklist selections and brief answers stay in page memory and disappear when the page is reloaded. Downloads are generated on your device. You can remove stored site data through your browser settings.</p><h3>No added tracking</h3><p>This site does not add advertising trackers, analytics, external font requests, or third-party scripts. Links to external resources open only when you choose them, and those sites have their own privacy practices.</p><h3>Hosting</h3><p>This website is hosted on GitHub Pages and can be visited without an account. GitHub may process standard connection details to deliver and protect the site. The planning tools run locally in your browser.</p><h3>No submission</h3><p>This is a fictional cybersecurity corporation. There is no live contact form, monitoring service, or incident intake. Downloading a checklist or brief does not send a request to anyone.</p></div>`);
  else openDialog(`<div class="dialog-body"><p class="eyebrow">ABOUT HUGEWARE</p><h2 id="dialog-title">Security.<br>For everyone.</h2><p class="lede">Hugeware is an imaginary cybersecurity corporation with a simple conviction: everyone deserves help protecting their digital world.</p><p>The concept spans personal security, organizational resilience, and incident readiness. The service descriptions express the fictional company’s intended offering; they do not represent an operating security provider.</p><h3>A visual language made of characters</h3><p>Our monogram, shield, network, radar, and surrounding artwork are built from text characters. The scenes are drawn live in your browser. Motion can be paused at any time, and the site respects your device’s reduced-motion preference.</p><h3>Our point of view</h3><p>Security should feel understandable and accessible. Our design brings that belief into focus: clear language, considered tools, and an identity built from the simplest digital building blocks.</p><p class="mono">for consumers. by consumers.</p></div>`);
}));

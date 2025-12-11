// onboarding.js

// --- 1. GLOBAL STATE & NAVIGATION ---
let currentFlow = ''; 

// Central State to hold user choices across steps
let appState = {
    logoHtml: '<i class="ph-fill ph-image text-2xl"></i>', // Default Icon
    logoBg: 'bg-gray-100', // Default Logo Background
    brandColor: 'bg-blue-600', // Default Header Color
    brandColorName: 'blue',
    description: 'Professional Services', // Default Description
    invoiceNum: 'INV-2024-001',
    amount: '$5,000.00'
};

document.addEventListener('DOMContentLoaded', () => {
    // Set default Due Date to Today + 14 days
    const date = new Date();
    date.setDate(date.getDate() + 14);
    const dateString = date.toISOString().split('T')[0];
    
    const dueEl = document.getElementById('invoice-due');
    if(dueEl) {
        dueEl.value = dateString;
        updatePreview(); // Trigger initial update
    }
});

// Transition from 3-Door Entry
function startFlow(flowType) {
    currentFlow = flowType;
    const entrySection = document.getElementById('entry-section');
    entrySection.style.opacity = '0';
    
    setTimeout(() => {
        entrySection.classList.add('hidden');
        if (flowType === 'action') {
            revealSection('flow-1a-input');
        } else if (flowType === 'benchmark') {
            revealSection('benchmark-section');
        } else {
            revealSection('data-ingestion-section');
            updateIngestionTitle(flowType);
        }
    }, 500);
}

function revealSection(id) {
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    setTimeout(() => {
        el.classList.remove('opacity-0');
        // If Flow 1A, trigger preview slide-in
        if (id === 'flow-1a-input') {
            const previewWrapper = document.getElementById('preview-wrapper');
            if(previewWrapper) {
                previewWrapper.classList.remove('hidden');
                setTimeout(() => previewWrapper.classList.remove('opacity-0', 'translate-x-10'), 100);
            }
        }
    }, 50);
}

function goBackToEntry() {
    document.querySelectorAll('section:not(#entry-section)').forEach(el => {
        el.classList.add('opacity-0');
        setTimeout(() => el.classList.add('hidden'), 500);
    });
    const entry = document.getElementById('entry-section');
    entry.classList.remove('hidden');
    setTimeout(() => entry.style.opacity = '1', 50);
}

// --- 2. FLOW 1A: MAGIC INPUT & DESIGNER ---
// --- DATABASE OF KNOWN COMPANIES (For Demo Address Prefill) ---
const companyDatabase = {
    'tesla.com': { name: 'Tesla, Inc.', address: '1 Tesla Road, Austin, TX 78725', reg: 'US-32198' },
    'stripe.com': { name: 'Stripe, Inc.', address: '354 Oyster Point Blvd, South San Francisco, CA 94080', reg: 'US-55667' },
    'google.com': { name: 'Google LLC', address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043', reg: 'US-90012' },
    'apple.com': { name: 'Apple Inc.', address: 'One Apple Park Way, Cupertino, CA 95014', reg: 'US-11223' },
    'microsoft.com': { name: 'Microsoft Corp', address: 'One Microsoft Way, Redmond, WA 98052', reg: 'US-44556' },
    'amazon.com': { name: 'Amazon.com, Inc.', address: '410 Terry Ave N, Seattle, WA 98109', reg: 'US-99887' },
    'airbnb.com': { name: 'Airbnb, Inc.', address: '888 Brannan St, San Francisco, CA 94103', reg: 'US-77441' },
    'spotify.com': { name: 'Spotify USA Inc.', address: '4 World Trade Center, 150 Greenwich St, New York, NY 10007', reg: 'US-22334' },
    'netflix.com': { name: 'Netflix, Inc.', address: '100 Winchester Cir, Los Gatos, CA 95032', reg: 'US-66554' }
};

function fetchBrand(domain) {
    const loader = document.getElementById('brand-loader');
    const logoPlaceholder = document.getElementById('logo-placeholder');
    const header = document.getElementById('preview-header');
    const actionButtons = document.getElementById('action-buttons');
    const cta = document.getElementById('preview-cta');

    // Basic validation
    if (domain.includes('.') && domain.length > 4) {
        loader.classList.remove('hidden');

        // 1. Construct Clearbit URL
        const logoUrl = `https://logo.clearbit.com/${domain}`;
        
        // 2. Create a temporary image to test if the logo exists
        const img = new Image();
        img.src = logoUrl;

        img.onload = function() {
            // SUCCESS: Real Logo Found
            loader.classList.add('hidden');
            
            // Render Real Logo
            appState.logoHtml = `<img src="${logoUrl}" class="w-10 h-10 object-contain" alt="Logo">`;
            appState.logoBg = 'bg-white border border-gray-100'; // White box for colored logos
            
            // Attempt to define brand color (Simplified for demo: Default Blue or match database)
            // In a full app, you'd use a library like 'colorthief' to extract color from the logo image
            appState.brandColor = 'bg-gray-900'; 
            
            applyBrandToUI(domain, true);
        };

        img.onerror = function() {
            // FAIL: Logo not found -> Fallback to Initials
            loader.classList.add('hidden');
            
            const letter = domain.charAt(0).toUpperCase();
            appState.logoHtml = `<span class="text-3xl font-bold text-gray-400">${letter}</span>`;
            appState.logoBg = 'bg-gray-100';
            appState.brandColor = 'bg-blue-600';

            applyBrandToUI(domain, false);
        };
    }
}

function applyBrandToUI(domain, isRealLogo) {
    const logoPlaceholder = document.getElementById('logo-placeholder');
    const header = document.getElementById('preview-header');
    const actionButtons = document.getElementById('action-buttons');

    // 1. Apply Logo HTML & Style
    logoPlaceholder.innerHTML = appState.logoHtml;
    logoPlaceholder.className = `w-16 h-16 rounded-lg flex items-center justify-center transition-all duration-500 shadow-sm ${appState.logoBg}`;
    
    // 2. Lookup "Mock" Address Data
    // We try to find the company in our list, otherwise generate a pretty name
    const companyData = companyDatabase[domain.toLowerCase()];
    
    if (companyData) {
        document.getElementById('client-name').value = companyData.name;
        document.getElementById('client-address').value = companyData.address;
        document.getElementById('client-reg').value = companyData.reg;
    } else {
        // Fallback: Capitalize Domain
        const cleanName = domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0];
        document.getElementById('client-name').value = cleanName;
        document.getElementById('client-address').value = ""; // Clear address if unknown
        document.getElementById('client-reg').value = "";
    }

    // 3. Update Text on Invoice Preview
    header.className = `h-2 w-full transition-colors duration-500 ${appState.brandColor}`;
    actionButtons.classList.remove('opacity-50', 'pointer-events-none');
    
    // Trigger the update function we wrote earlier to refresh the text/footer
    updateEntityDetails();

    // Auto-transition accordion for flow
    setTimeout(() => {
        toggleAccordion('acc-invoice');
    }, 1000);
}

function setDesc(text) {
    document.getElementById('invoice-desc').value = text;
    updatePreview();
}

function updatePreview() {
    const amount = document.getElementById('invoice-amount').value;
    const invNum = document.getElementById('invoice-number').value;
    const desc = document.getElementById('invoice-desc').value;
    
    // New Fields
    const vat = document.getElementById('invoice-vat').value;
    const dueDate = document.getElementById('invoice-due').value;

    // Save to State
    appState.amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    appState.invoiceNum = invNum ? invNum : '#INV-2024-001';
    appState.description = desc ? desc : 'Professional Services';

    // Update Accordion Label
    document.getElementById('lbl-invoice-amount').innerText = appState.amount;

    // Update DOM Flow 1A
    const amountEl = document.getElementById('preview-amount');
    if (amountEl) amountEl.innerText = appState.amount;
    
    // Update Date Display in Preview
    const dateEl = document.querySelector('#invoice-display-area span.text-red-500');
    if(dateEl && dueDate) {
        const d = new Date(dueDate);
        dateEl.innerText = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const numEl = document.getElementById('preview-inv-num-display');
    if (numEl) numEl.innerText = appState.invoiceNum;
    
    // Handle Description & VAT injection (simpler to just re-render style)
    const currentStyle = document.querySelector('#invoice-display-area select')?.value || 'card';
    updateStyle('invoice', currentStyle); 
}

function switchDesignTab(tab) {
    const btnData = document.getElementById('tab-data');
    const btnStyle = document.getElementById('tab-style');
    const panelData = document.getElementById('panel-data');
    const panelStyle = document.getElementById('panel-style');

    if (tab === 'data') {
        btnData.classList.add('bg-blue-600', 'text-white', 'shadow-md');
        btnData.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-white/5');
        btnStyle.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        btnStyle.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-white/5');
        
        panelData.classList.remove('hidden');
        panelStyle.classList.add('hidden');
    } else {
        btnStyle.classList.add('bg-blue-600', 'text-white', 'shadow-md');
        btnStyle.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-white/5');
        btnData.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        btnData.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-white/5');

        panelStyle.classList.remove('hidden');
        panelData.classList.add('hidden');
    }
}

function updateStyle(type, value) {
    const previewContainer = document.getElementById('preview-container');
    const invoiceArea = document.getElementById('invoice-display-area');
    const bankArea = document.getElementById('bank-display-area');
    const amount = appState.amount;
    const desc = appState.description;

    if (type === 'layout') {
        const btnNarrow = document.getElementById('btn-layout-narrow');
        const btnWide = document.getElementById('btn-layout-wide');
        
        if (value === 'narrow') {
            previewContainer.classList.remove('max-w-2xl');
            previewContainer.classList.add('max-w-md');
            btnNarrow.classList.add('bg-blue-600', 'text-white');
            btnNarrow.classList.remove('text-gray-400', 'hover:text-white');
            btnWide.classList.remove('bg-blue-600', 'text-white');
            btnWide.classList.add('text-gray-400', 'hover:text-white');
        } else {
            previewContainer.classList.remove('max-w-md');
            previewContainer.classList.add('max-w-2xl');
            btnWide.classList.add('bg-blue-600', 'text-white');
            btnWide.classList.remove('text-gray-400', 'hover:text-white');
            btnNarrow.classList.remove('bg-blue-600', 'text-white');
            btnNarrow.classList.add('text-gray-400', 'hover:text-white');
        }
    }

    if (type === 'invoice') {
        if (value === 'simple') {
            invoiceArea.innerHTML = `
                <div class="border-t-2 border-dashed border-gray-100 py-6 mb-8">
                    <div class="flex justify-between mb-3 text-base">
                        <span class="text-gray-600 font-medium">${desc}</span>
                        <span class="font-bold text-gray-900">${amount}</span>
                    </div>
                    <div class="flex justify-between text-base">
                        <span class="text-gray-600 font-medium">Total Due</span>
                        <span class="font-bold text-blue-600">${amount}</span>
                    </div>
                </div>`;
        } else if (value === 'card') {
            invoiceArea.innerHTML = `
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-xs font-medium text-gray-500 uppercase">${desc}</span>
                        <span class="text-xl font-bold text-gray-900">${amount}</span>
                    </div>
                    <div class="w-full bg-gray-200 h-px mb-3"></div>
                    <div class="flex justify-between text-xs">
                        <span class="text-gray-500">Due Date</span>
                        <span class="font-medium text-red-500">Oct 17, 2025</span>
                    </div>
                </div>`;
        } else if (value === 'table') {
            invoiceArea.innerHTML = `
                <table class="w-full text-sm text-left text-gray-500 mb-8 border border-gray-200 rounded-lg overflow-hidden">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" class="px-4 py-3">Description</th>
                            <th scope="col" class="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="bg-white border-b hover:bg-gray-50">
                            <td class="px-4 py-3 font-medium text-gray-900">${desc}</td>
                            <td class="px-4 py-3 text-right">${amount}</td>
                        </tr>
                        <tr class="bg-white font-bold">
                            <td class="px-4 py-3 text-gray-900">Total</td>
                            <td class="px-4 py-3 text-right text-blue-600">${amount}</td>
                        </tr>
                    </tbody>
                </table>`;
        }
    }

    if (type === 'bank') {
        if (value === 'hidden') {
            bankArea.classList.add('hidden');
        } else if (value === 'footer') {
            bankArea.className = "mb-6 text-[10px] text-gray-400 text-center italic";
            bankArea.innerHTML = "Please pay to IBAN: NL88 MAXB 0123 4567 89 (MaxBank)";
            bankArea.classList.remove('hidden');
        } else if (value === 'table') {
            bankArea.className = "mb-6 text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200";
            bankArea.innerHTML = `
                <div class="grid grid-cols-2 gap-2">
                    <span class="font-semibold">Bank:</span> <span>MaxBank Intl</span>
                    <span class="font-semibold">IBAN:</span> <span>NL88 MAXB 0123 4567 89</span>
                    <span class="font-semibold">BIC:</span> <span>MAXBNL2A</span>
                </div>`;
            bankArea.classList.remove('hidden');
        }
    }

    if (type === 'color') {
        appState.brandColorName = value; // Store choice
        const header = document.getElementById('preview-header');
        const cta = document.getElementById('preview-cta');
        const colorMap = {
            'blue': 'bg-blue-600',
            'emerald': 'bg-emerald-500',
            'purple': 'bg-purple-600',
            'slate': 'bg-slate-700'
        };
        
        // Update State
        appState.brandColor = colorMap[value];

        // Apply
        const classes = ['bg-blue-600', 'bg-emerald-500', 'bg-purple-600', 'bg-slate-700'];
        header.classList.remove(...classes);
        cta.classList.remove(...classes);
        header.classList.add(colorMap[value]);
        cta.classList.add(colorMap[value]);
    }
}

function toggleElement(element) {
    const check = document.getElementById(`check-${element}`);
    const previewEl = document.getElementById(`preview-${element}`);
    
    if (check.classList.contains('bg-blue-500')) {
        check.classList.remove('bg-blue-500', 'border-blue-500');
        check.classList.add('border-gray-500'); 
        if (element === 'banner') {
            previewEl.classList.remove('flex');
            previewEl.classList.add('hidden');
        } else {
            previewEl.classList.add('hidden');
        }
    } else {
        check.classList.add('bg-blue-500', 'border-blue-500');
        check.classList.remove('border-gray-500'); 
        if (element === 'banner') {
            previewEl.classList.remove('hidden');
            previewEl.classList.add('flex');
        } else {
            previewEl.classList.remove('hidden');
        }
    }
}

// --- ACCORDION LOGIC ---
function toggleAccordion(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById('icon-' + id);
    
    // Toggle Max Height for smooth slide
    if (el.style.maxHeight && el.style.maxHeight !== '0px') {
        el.style.maxHeight = '0px';
        icon.classList.remove('rotate-180');
    } else {
        // Close others (optional, for accordion behavior)
        ['acc-client', 'acc-invoice', 'acc-sender'].forEach(key => {
            if(key !== id) {
                document.getElementById(key).style.maxHeight = '0px';
                const otherIcon = document.getElementById('icon-' + key);
                if(otherIcon) otherIcon.classList.remove('rotate-180');
            }
        });

        el.style.maxHeight = '500px'; // Arbitrary large number
        icon.classList.add('rotate-180');
    }
}

// --- UPDATE ENTITY DETAILS (Client & Sender) ---
function updateEntityDetails() {
    // 1. Get Values
    const clientName = document.getElementById('client-name').value || "Client Name";
    const clientAddress = document.getElementById('client-address').value;
    const clientReg = document.getElementById('client-reg').value;
    
    const senderName = document.getElementById('sender-name').value || "MaxCredible Inc.";
    const senderAddress = document.getElementById('sender-address').value || "123 Finance St, NY";
    const senderTax = document.getElementById('sender-tax').value || "US123456789";

    // 2. Update Labels in Accordion Header
    const website = document.getElementById('client-website').value;
    document.getElementById('lbl-client-domain').innerText = clientName !== "Client Name" ? clientName : website;
    document.getElementById('lbl-sender-name').innerText = senderName;

    // 3. Update Preview DOM
    document.getElementById('preview-client-name').innerText = clientName;
    
    // Create detailed address string for client
    let clientDetailsHtml = `<span class="block">${document.getElementById('preview-website').innerText}</span>`;
    if(clientAddress) clientDetailsHtml += `<span class="block text-gray-400 mt-1">${clientAddress}</span>`;
    if(clientReg) clientDetailsHtml += `<span class="block text-gray-400">Reg: ${clientReg}</span>`;
    
    // We need to inject this into the preview. 
    // Note: In HTML, the preview-website element is currently just the email. 
    // Let's target the parent div of preview-website to append details.
    const websiteEl = document.getElementById('preview-website');
    if(websiteEl) {
        websiteEl.innerHTML = clientDetailsHtml;
    }

    // 4. Update Footer (Sender Details)
    const footerEl = document.getElementById('preview-footer');
    if(footerEl) {
        footerEl.innerHTML = `<p>${senderName} • ${senderAddress} • VAT: ${senderTax}</p>`;
    }
}

// --- SMART ACTIONS LOGIC ---
let smartActions = {
    paylink: true, // Default ON
    responses: false
};

function toggleSmartAction(action) {
    smartActions[action] = !smartActions[action];
    
    // 1. Visual Toggle Update
    const toggle = document.getElementById(`toggle-${action}`);
    const dot = toggle.querySelector('div');
    
    if (smartActions[action]) {
        toggle.classList.remove('bg-gray-700');
        toggle.classList.add('bg-green-500');
        dot.classList.add('translate-x-5');
        dot.classList.remove('left-1');
        dot.classList.add('right-1'); // simple fix for positioning
    } else {
        toggle.classList.add('bg-gray-700');
        toggle.classList.remove('bg-green-500');
        dot.classList.remove('translate-x-5');
        dot.classList.add('left-1');
        dot.classList.remove('right-1');
    }

    // 2. Trigger Re-render of Email Preview
    renderPreview();
}


// --- 3. TRANSITION TO FLOW 1B (SYNC) ---

function goToTimeline() {
    const sectionA = document.getElementById('flow-1a-input');
    const sectionB = document.getElementById('flow-1b-timeline');

    // 1. SYNC DATA from 1A to 1B
    syncPreviewToTimeline();

    // 2. ANIMATE
    sectionA.classList.add('opacity-0');
    setTimeout(() => {
        sectionA.classList.add('hidden');
        sectionB.classList.remove('hidden');
        
        setTimeout(() => {
            sectionB.classList.remove('opacity-0');
            selectStep('reminder1'); 
        }, 50);
    }, 500);
}

function syncPreviewToTimeline() {
    // 1. GATHER DATA from Flow 1A Input
    const clientName = document.getElementById('client-name').value || "Client Name";
    const invoiceNum = document.getElementById('invoice-number').value || "#INV-001";
    const desc = document.getElementById('invoice-desc').value || "Services";
    const amount = document.getElementById('invoice-amount').value;
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    
    // Sender Details (for Footer)
    const senderName = document.getElementById('sender-name').value || "MaxCredible Inc.";
    const senderAddress = document.getElementById('sender-address').value || "123 Finance St, NY";
    const senderTax = document.getElementById('sender-tax').value || "";

    // 2. UPDATE EMAIL CONTENT OBJECTS (Dynamic Injection)
    // We update the 'body1' of our templates to include specific names/amounts
    
    emailCopy.friendly.body1 = `Hi ${clientName},<br><br>We hope you're having a great week! This is just a friendly nudge that invoice <strong class="text-blue-400">${invoiceNum}</strong> for <strong>${desc}</strong> is due.`;
    
    emailCopy.professional.body1 = `Dear ${clientName},<br><br>Our records indicate that payment for invoice <strong>${invoiceNum}</strong> (${desc}) is currently outstanding.`;

    emailCopy.strict.body1 = `ATTN: ${clientName},<br><br>We have not received payment for invoice <strong>${invoiceNum}</strong>. This balance of <strong>${formattedAmount}</strong> is now overdue.`;

    // 3. VISUAL SYNC (Logo & Header)
    const logoContainer = document.getElementById('preview-logo-container');
    if(logoContainer) {
        // Carry over the logo HTML and background style
        logoContainer.className = `w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md ${appState.logoBg} mr-4`;
        logoContainer.innerHTML = appState.logoHtml;
    }

    // 4. UPDATE PREVIEW HEADER INFO
    document.getElementById('preview-date').innerText = `Sent: ${new Date().toLocaleDateString()}`;
    // We can use the header area to show the "From" name
    const headerInfo = document.getElementById('preview-logo-container').nextElementSibling;
    if(headerInfo) {
        headerInfo.innerHTML = `
            <p class="font-bold text-gray-700">${senderName}</p>
            <p class="text-xs text-gray-400">To: ${clientName}</p>
        `;
    }

    // 5. INJECT INVOICE CARD DATA (The mini invoice inside the email)
    // You might need to add IDs to the timeline HTML to target these specific elements if they don't exist
    // For now, we force a re-render
    renderPreview();
}

function goBackToInput() {
    const sectionA = document.getElementById('flow-1a-input');
    const sectionB = document.getElementById('flow-1b-timeline');
    
    sectionB.classList.add('opacity-0');
    setTimeout(() => {
        sectionB.classList.add('hidden');
        sectionA.classList.remove('hidden');
        setTimeout(() => sectionA.classList.remove('opacity-0'), 50);
    }, 500);
}

// --- 4. FLOW 1B: STRATEGY LOGIC ---

let strategyState = {
    preminder: false,
    reminder1: true, 
    reminder2: false,
    final: false,
    currentSelection: 'reminder1', 
    tone: 'friendly'
};

const emailCopy = {
    friendly: {
        subject: "Friendly Reminder",
        headline: "Hi Finance Team,",
        body1: "Placeholder body.", // Will be overwritten by sync
        body2: "We know things get busy, so we've attached a copy for your records.",
        cta: "Pay Now securely"
    },
    professional: {
        subject: "Outstanding Invoice",
        headline: "Dear Accounts Payable,",
        body1: "Placeholder body.",
        body2: "Please review the attached invoice and facilitate payment at your earliest convenience.",
        cta: "View & Pay Invoice"
    },
    strict: {
        subject: "OVERDUE: Payment Required",
        headline: "Urgent Attention Required,",
        body1: "Placeholder body.",
        body2: "Please settle this balance immediately to avoid further escalation or service interruption.",
        cta: "Make Payment Now"
    },
    preminder: {
        subject: "Upcoming Payment",
        headline: "Hi there,",
        body1: "Just a quick heads up that your invoice is scheduled for payment in 3 days.",
        body2: "No action needed if you've already scheduled this.",
        cta: "View Invoice"
    },
    final: {
        subject: "FINAL NOTICE",
        headline: "Final Warning,",
        body1: "Despite multiple reminders, this invoice remains unpaid. This is your final notice.",
        body2: "If payment is not received within 24 hours, this account will be transferred to our collections partner.",
        cta: "Pay to Avoid Collections"
    }
};

function toggleStep(stepName) {
    const isActive = !strategyState[stepName];
    strategyState[stepName] = isActive; 

    const dot = document.getElementById(`dot-${stepName}`);
    const text = document.getElementById(`text-${stepName}`);
    const toggle = document.getElementById(`toggle-${stepName}`); 
    
    if (isActive) {
        dot.classList.remove('bg-slate-600');
        dot.classList.add('bg-blue-500', 'shadow-[0_0_15px_rgba(59,130,246,0.6)]');
        text.classList.remove('opacity-50');
        text.classList.add('opacity-100');
        if(toggle) {
            toggle.classList.remove('bg-gray-700');
            toggle.classList.add('bg-green-500');
            toggle.querySelector('.dot').classList.add('translate-x-6');
        }
        selectStep(stepName);
    } else {
        dot.classList.add('bg-slate-600');
        dot.classList.remove('bg-blue-500', 'shadow-[0_0_15px_rgba(59,130,246,0.6)]');
        text.classList.add('opacity-50');
        text.classList.remove('opacity-100');
        if(toggle) {
            toggle.classList.add('bg-gray-700');
            toggle.classList.remove('bg-green-500');
            toggle.querySelector('.dot').classList.remove('translate-x-6');
        }
        if (strategyState.currentSelection === stepName) {
            selectStep('reminder1');
        }
    }
}

function selectStep(stepName) {
    strategyState.currentSelection = stepName;
    ['preminder', 'reminder1', 'reminder2', 'final'].forEach(s => {
        const dot = document.getElementById(`dot-${s}`);
        if(dot) {
            if(s === stepName) {
                dot.classList.add('scale-125', 'ring-2', 'ring-white');
            } else {
                dot.classList.remove('scale-125', 'ring-2', 'ring-white');
            }
        }
    });
    renderPreview();
}

function setTone(tone) {
    strategyState.tone = tone;
    ['friendly', 'professional', 'strict', 'custom'].forEach(t => {
        const btn = document.getElementById(`btn-${t}`);
        if (t === tone) {
            btn.classList.remove('border-white/10', 'bg-white/5', 'text-slate-400');
            btn.classList.add('border-blue-500', 'bg-blue-500/20', 'text-white');
        } else {
            btn.classList.add('border-white/10', 'bg-white/5', 'text-slate-400');
            btn.classList.remove('border-blue-500', 'bg-blue-500/20', 'text-white');
        }
    });
    renderPreview();
}

function renderPreview() {
    const step = strategyState.currentSelection;
    const tone = strategyState.tone;
    let content;

    if (step === 'preminder') {
        content = emailCopy.preminder;
    } else if (step === 'final') {
        content = emailCopy.final;
    } else {
        content = emailCopy[tone];
    }

    // --- FIX: Only declare bodyArea once ---
    const bodyArea = document.getElementById('email-content-area');
    const subjectLine = document.getElementById('preview-subject');
    
    // 1. Payment Link Button
    const btn = bodyArea.querySelector('button');
    if(btn) {
        if(smartActions.paylink) {
            btn.classList.remove('hidden');
            btn.innerText = `Pay ${appState.amount || '$0.00'} Now`;
        } else {
            btn.classList.add('hidden');
        }
    }

    // 2. Response Hotkeys (The "Chips")
    // Check if chips container exists, if not create it
    let chipsContainer = document.getElementById('response-chips');
    if (!chipsContainer) {
        chipsContainer = document.createElement('div');
        chipsContainer.id = 'response-chips';
        chipsContainer.className = "flex flex-wrap gap-2 justify-center mt-4 pt-4 border-t border-gray-100";
        // Insert after the button container
        const btnContainer = bodyArea.querySelector('.text-center.pt-2');
        if(btnContainer) btnContainer.appendChild(chipsContainer);
    }

    if (smartActions.responses) {
        chipsContainer.classList.remove('hidden');
        chipsContainer.innerHTML = `
            <span class="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 cursor-pointer">I'll pay today</span>
            <span class="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 cursor-pointer">Ask Question</span>
            <span class="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 cursor-pointer">Dispute Invoice</span>
        `;
    } else {
        chipsContainer.classList.add('hidden');
    }
    
    // DOM Updates
    if (subjectLine) subjectLine.innerText = `${content.subject}: ${appState.invoiceNum}`;
    
    if (bodyArea) {
        document.getElementById('preview-headline').innerText = content.headline;
        document.getElementById('preview-body-1').innerHTML = content.body1; 
        document.getElementById('preview-body-2').innerHTML = content.body2;
        
        // Update CTA Button Color
        const btn = bodyArea.querySelector('button');
        if(btn) {
            btn.innerText = content.cta;
            // Re-apply brand color to button in Timeline view
            btn.className = `font-bold py-3 px-8 rounded-lg shadow-lg transition-all hover:-translate-y-0.5 text-white ${appState.brandColor}`;
        }
    }
}

// --- 5. REGISTRATION & UTILS ---
function openRegistration() {
    const modal = document.getElementById('register-modal');
    
    // Elements to update
    const title = document.getElementById('reg-title');
    const desc = document.getElementById('reg-desc');
    const btn = document.getElementById('reg-btn');
    const icon = document.getElementById('reg-icon');
    const iconContainer = document.getElementById('reg-icon-container');
    const bar = document.getElementById('reg-bar');

    // 1. Configure Modal Content based on Context
    if (currentFlow === 'action') {
        // Flow 1: Action (Payment Journey)
        title.innerText = "Save your Payment Journey";
        desc.innerText = "Create an account to save this configuration as a Fixed Profile and automate future reminders.";
        btn.innerText = "Save & Activate Workflow";
        
        // Styling: Blue/Rocket
        icon.className = "ph-fill ph-rocket-launch";
        iconContainer.className = "w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-lg shadow-blue-500/20";
        btn.className = "w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all text-lg hover:-translate-y-0.5 mt-2";
        bar.className = "absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600";
    
    } else if (currentFlow === 'insight') {
        // Flow 2: Insight (Risk Analysis)
        title.innerText = "Unlock Recoverable Cash";
        desc.innerHTML = "Register to view the detailed <strong>Risk Report</strong> and claim your <strong>$12,500</strong> recovery plan.";
        btn.innerText = "Unlock Report";
        
        // Styling: Pink/Lock
        icon.className = "ph-fill ph-lock-key-open";
        iconContainer.className = "w-16 h-16 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-lg shadow-pink-500/20";
        btn.className = "w-full bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-pink-600/30 transition-all text-lg hover:-translate-y-0.5 mt-2";
        bar.className = "absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-rose-600";

    } else if (currentFlow === 'benchmark') {
        // Flow 3: Benchmark (Data Comparison)
        title.innerText = "Get the Action Plan";
        desc.innerText = "Create an account to see the 3-step recommendation to close the 9-day gap.";
        btn.innerText = "View Recommendations";
        
        // Styling: Emerald/Chart
        icon.className = "ph-fill ph-chart-line-up";
        iconContainer.className = "w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-lg shadow-emerald-500/20";
        btn.className = "w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all text-lg hover:-translate-y-0.5 mt-2";
        bar.className = "absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600";
    
    } else if (currentFlow === 'skip') {
        // Skip Flow: Generic Save
        title.innerText = "Save & Continue";
        desc.innerText = "Create your account to enter the dashboard.";
        btn.innerText = "Complete Setup";
        
        // Styling: Slate/User
        icon.className = "ph-fill ph-user-circle";
        iconContainer.className = "w-16 h-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-lg shadow-slate-500/20";
        btn.className = "w-full bg-slate-600 hover:bg-slate-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-600/30 transition-all text-lg hover:-translate-y-0.5 mt-2";
        bar.className = "absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-slate-400 to-gray-600";
    }

    // 2. Show Modal
    modal.classList.remove('hidden');
}

function closeRegisterModal() {
    document.getElementById('register-modal').classList.add('hidden');
}

function skipOnboarding() {
    // Treat skipping as entering via a generic flow to show the "Save Account" modal
    currentFlow = 'skip';
    openRegistration(); 
}

function handleRegistration(event) {
    event.preventDefault();
    
    // Simulate API Call & Email Trigger
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    btn.innerText = "Creating Account...";
    btn.disabled = true;

    setTimeout(() => {
        // Mock Success
        btn.innerText = "Success!";
        btn.classList.remove('bg-blue-600', 'bg-pink-600', 'bg-emerald-600');
        btn.classList.add('bg-green-500');
        
        // VISUAL FEEDBACK FOR EMAIL
        alert("Account Created!\n\nSystem Notification: An email has been automatically sent to s.vantulder@maxcredible.com with these new user details.");
        
        // Reset (Optional - usually would redirect to dashboard)
        setTimeout(() => {
            closeRegisterModal();
            btn.disabled = false;
            btn.innerText = originalText;
            // Redirect logic would go here
        }, 1000);
    }, 1500);
}

// --- 6. DATA INGESTION LOGIC (DOOR 2) ---

function simulateConnect(provider) {
    // 1. Hide Input, Show Loader
    document.getElementById('ingest-step-1').classList.add('hidden');
    document.getElementById('ingest-loader').classList.remove('hidden');
    document.getElementById('connecting-provider').innerText = provider;
    
    // Update the result header with the chosen provider
    const resultSource = document.getElementById('connected-source');
    if(resultSource) resultSource.innerText = provider;

    // 2. Wait 2 seconds, then show Results
    setTimeout(() => {
        document.getElementById('ingest-loader').classList.add('hidden');
        document.getElementById('ingest-results').classList.remove('hidden');
    }, 2000);
}

function simulateUpload() {
    simulateConnect('CSV Upload');
}

// --- 7. SUITE SEARCH LOGIC ---

// Full list from suites.txt
const accountingSuites = [
    "1C:Enterprise", "24SevenOffice", "AccountView", "Acumatica", "Acumulus",
    "Addison", "AFAS", "Alegra", "Asperion", "Banqup", "Basecone", "Bexio",
    "Bill-to-box", "Bind ERP", "Cash Software", "Collmex", "Contpaqi", "DATEV",
    "Defontana", "e-Boekhouden.nl", "e-conomic", "Exact Online", "Financio",
    "Fortnox", "FreshBooks", "Infor", "JeFacture", "Kashoo",
    "King Business Software", "Kingdee", "Lexware", "Manager",
    "Microsoft Dynamics 365", "Moneybird", "MYOB", "Nubox", "Octopus", "Odoo",
    "Omie", "Oracle NetSuite", "QuickBooks Online", "Reckon", "Reeleezee",
    "Rompslomp", "Sage", "Sage 300", "Sage 50", "Sage Intacct",
    "SAP Business One", "SevDesk", "Siigo", "SnelStart", "Tally Solutions",
    "Tipalti", "TOTVS", "Twinfield", "Unified Post", "Visma eAccounting",
    "Wave Accounting", "WinBooks", "Workday Financials", "Xero", "Yardi",
    "Yonyou", "Yuki", "Zoho Books"
];

function handleSuiteSearch(query) {
    const dropdown = document.getElementById('search-dropdown');
    
    // 1. Clear if empty
    if (!query || query.length < 2) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        return;
    }

    // 2. Filter matches (Case insensitive)
    const matches = accountingSuites.filter(suite => 
        suite.toLowerCase().includes(query.toLowerCase())
    );

    // 3. Render Results
    if (matches.length > 0) {
        dropdown.classList.remove('hidden');
        dropdown.innerHTML = matches.map(suite => `
            <div onclick="selectSuite('${suite}')" class="p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0 flex items-center justify-between group">
                <span class="text-gray-200 font-medium group-hover:text-white">${suite}</span>
                <i class="ph-bold ph-caret-right text-gray-500 group-hover:text-blue-400"></i>
            </div>
        `).join('');
    } else {
        dropdown.classList.remove('hidden');
        dropdown.innerHTML = `
            <div class="p-4 text-gray-500 text-sm text-center">
                No integration found. <span class="text-blue-400 cursor-pointer underline" onclick="simulateUpload()">Try uploading CSV?</span>
            </div>
        `;
    }
}

function selectSuite(suiteName) {
    // Hide dropdown
    document.getElementById('search-dropdown').classList.add('hidden');
    document.getElementById('suite-search-input').value = suiteName;
    
    // Trigger the connection simulation
    simulateConnect(suiteName);
}

function openDebtorDetail(name) {
    // Optional: Could open a side panel here
    // For now, just trigger the registration modal as the "Deep Dive"
    openRegistration();
}

function runBenchmark() {
    // 1. Get Selections
    const industry = document.getElementById('bench-industry').value;
    const region = document.getElementById('bench-region').value;

    // 2. Mock Loading
    const btn = document.querySelector('#benchmark-config button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Crunching Data...';
    
    setTimeout(() => {
        // 3. Hide Config, Show Results
        document.getElementById('benchmark-config').classList.add('hidden');
        document.getElementById('benchmark-results').classList.remove('hidden');
        
        // Update tags
        document.getElementById('result-industry-tag').innerText = `${industry} • ${region}`;

        // 4. Animate the "User Performance" Bar
        // We delay slightly to allow the DOM to render
        setTimeout(() => {
            document.getElementById('bar-user-perf').style.width = '62%'; 
        }, 100);

    }, 1500);
}
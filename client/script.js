(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const byId = id => document.getElementById(id);
  
  const API_URL = 'http://localhost:9090/api';
  let token = localStorage.getItem('token');
  let currentUser = null;

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['x-access-token'] = token;
    
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, config);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    } catch (err) {
      alert(err.message);
      throw err;
    }
  };

  // --- Navigation ---
  const tabs = $$(".tab");
  const pages = $$(".page");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      pages.forEach(page => page.classList.remove("active"));
      byId(tab.dataset.target)?.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Refresh data when switching tabs
      if (tab.dataset.target === 'merchant' || tab.dataset.target === 'courier') {
        fetchData();
      }
      if (tab.dataset.target === 'payments') {
        renderTx();
        syncShipments();
      }
    });
  });

  $$("[data-scroll]").forEach(btn =>
    btn.addEventListener("click", () => {
      $(btn.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    })
  );

  byId("yr").textContent = new Date().getFullYear();

  // --- Data ---
  // --- Data ---
  const data = {
    activeBids: [],
    deliveries: [],
    availableBids: [],
    assigned: [],
  };

  const list = (node, items, template) => {
    node.innerHTML = items.map(template).join("");
  };

  const fetchData = async () => {
    if (!currentUser) return;
    
    try {
      if (currentUser.role === 'merchant') {
        data.activeBids = await apiCall(`/bids/my-bids?merchantId=${currentUser._id}`);
        data.deliveries = await apiCall(`/deliveries?merchantId=${currentUser._id}`);
        renderActiveBids();
        renderDeliveries();
      } else {
        data.availableBids = await apiCall('/bids');
        data.assigned = await apiCall(`/deliveries?courierId=${currentUser._id}`);
        renderAvailableBids();
        renderAssigned();
      }
    } catch (e) { console.error(e); }
  };

  const activeBidsEl = byId("activeBids");
  const deliveriesEl = byId("myDeliveries");
  const availableBidsEl = byId("availableBids");
  const assignedEl = byId("assigned");
  const pendingBidsEl = byId("pendingBids");

  const renderActiveBids = () =>
    list(activeBidsEl, data.activeBids, b => `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <div class="title">Bid · ${b.productDescription}</div>
          <span class="badge ${b.status === "Open" ? "info" : "warn"}">${b.status}</span>
        </div>
        <div class="meta">
          <span class="pill">Pickup: ${b.pickupLocation}</span>
          <span class="pill">Drop: ${b.dropLocation}</span>
          <span class="pill">Cap: ৳${b.maxPrice}</span>
          <span class="pill">Expires: ${new Date(b.expectedTime).toLocaleString()}</span>
        </div>
        ${b.status === 'Open' ? `<div class="sub" style="margin-top:5px"><a href="#" onclick="viewProposals('${b._id}')">View Proposals</a></div>` : ''}
      </div>
    `);
    
  window.viewProposals = async (bidId) => {
    try {
      const proposals = await apiCall(`/bids/${bidId}/proposals`);
      alert(`Proposals:\n${proposals.map(p => `${p.courier.name}: ৳${p.price} (${p.eta})`).join('\n')}`);
      // In a real app, show a modal to accept
      if (proposals.length > 0 && confirm('Accept first proposal?')) {
        await apiCall(`/bids/proposals/${proposals[0]._id}/accept`, 'POST');
        alert('Proposal accepted!');
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const renderDeliveries = () =>
    list(deliveriesEl, data.deliveries, d => `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <div class="title">Delivery · ${d.bid.productDescription}</div>
          <span class="badge ${d.status === "Delivered" ? "success" : "info"}">${d.status}</span>
        </div>
        <div class="meta">
          <span class="pill">From: ${d.bid.pickupLocation}</span>
          <span class="pill">To: ${d.bid.dropLocation}</span>
          <span class="pill">Courier: ${d.courier.name}</span>
        </div>
      </div>
    `);

  const renderAvailableBids = () =>
    list(availableBidsEl, data.availableBids, b => `
      <div class="card">
        <div class="title">${b.productDescription} · ${b.pickupLocation} → ${b.dropLocation}</div>
        <div class="meta">
          <span class="pill">Merchant: ${b.merchant.name}</span>
          <span class="pill">Time: ${new Date(b.expectedTime).toLocaleString()}</span>
          <span class="pill">Max: ৳${b.maxPrice}</span>
        </div>
        <div class="space"></div>
        <button class="btn" data-bid="${b._id}">Place Bid</button>
      </div>
    `);

  const renderAssigned = () =>
    list(assignedEl, data.assigned, a => `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <div class="title">${a.bid.productDescription}</div>
          <span class="badge info">${a.status}</span>
        </div>
        <div class="meta">
           <span class="pill">Pickup: ${a.bid.pickupLocation}</span>
           <span class="pill">Drop: ${a.bid.dropLocation}</span>
        </div>
        <div class="space"></div>
        ${a.status !== 'Delivered' && a.status !== 'Cancelled' ? 
          `<button class="btn" onclick="updateStatus('${a._id}', '${a.status}')">Update Status</button>` : ''}
      </div>
    `);

  window.updateStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'Picked Up' : 
                       currentStatus === 'Picked Up' ? 'In Transit' :
                       currentStatus === 'In Transit' ? 'Delivered' : null;
    
    if (nextStatus && confirm(`Update status to ${nextStatus}?`)) {
      try {
        await apiCall(`/deliveries/${id}/status`, 'PATCH', { status: nextStatus });
        fetchData();
      } catch (e) { console.error(e); }
    }
  };

  const renderAll = () => {
    renderActiveBids();
    renderDeliveries();
    renderAvailableBids();
    renderAssigned();
  };

  renderAll();

  // --- Modals ---
  const show = id => byId(id).classList.add("show");
  const hide = id => byId(id).classList.remove("show");

  byId("openBid").addEventListener("click", () => show("bidOverlay"));
  $$("[data-close]").forEach(btn => btn.addEventListener("click", () => hide(btn.dataset.close)));

  // --- Create bid (demo only) ---
  const paySelect = byId("payShipment");
  const syncShipments = () => {
    // Use fetched deliveries for payment dropdown
    if (data.deliveries) {
      paySelect.innerHTML = data.deliveries
        .map(d => `<option value="${d._id}">${d.bid.productDescription} — ৳${d.bid.maxPrice}</option>`)
        .join("");
    }
  };
  // Call syncShipments after fetching data
  const originalFetchData = fetchData;
  // We can't easily override const, so let's just call syncShipments inside renderDeliveries or similar
  // Or better, just call it when opening the payments tab or after fetchData
  
  // --- Payments ---
  const balanceEl = byId("balance");
  const methods = byId("methods");
  const payNote = byId("payNote");
  const txHistoryEl = byId("txHistory");

  methods.addEventListener("click", event => {
    const card = event.target.closest(".method");
    if (!card) return;
    $$(
      ".method",
      methods
    ).forEach(item => item.classList.remove("active"));
    card.classList.add("active");
  });

  const renderTx = async () => {
    if (!currentUser) return;
    try {
      const tx = await apiCall(`/payments/history?userId=${currentUser._id}`);
      txHistoryEl.innerHTML =
        tx
          .map(t => `
            <div class="card">
              <div class="row" style="justify-content:space-between">
                <div class="title">TX-${t._id.substr(-4)}</div>
                <span class="badge success">৳${t.amount}</span>
              </div>
              <div class="sub">Method: ${t.method.toUpperCase()} • ${new Date(t.createdAt).toLocaleString()}</div>
            </div>
          `)
          .join("") || `<div class="sub">No transactions yet.</div>`;
    } catch (e) { console.error(e); }
  };

  byId("makePayment").addEventListener("click", async () => {
    const amt = Number(byId("payAmount").value) || 0;
    if (amt <= 0) {
      alert("Enter an amount.");
      return;
    }

    const method = methods.querySelector(".active")?.dataset.method || "bank";
    const description = "Payment for delivery"; // Could be more specific

    try {
      await apiCall('/payments/initiate', 'POST', {
        userId: currentUser._id,
        amount: amt,
        method,
        description
      });
      
      alert(`Paid ৳${amt} via ${method.toUpperCase()}.`);
      byId("payAmount").value = "";
      renderTx();
      // Update balance locally or refetch user
      const user = await apiCall('/auth/me');
      balanceEl.textContent = user.balance;
    } catch (e) { console.error(e); }
  });

  // --- Tracking (demo) ---
  byId("trackBtn").addEventListener("click", async () => {
    const id = byId("trackId").value.trim();
    if (!id) {
      alert("Enter a tracking ID");
      return;
    }

    try {
      const t = await apiCall(`/tracking/${id}`);
      
      byId("trackDetails").innerHTML = `
        <div class="meta">
          <span class="pill">Status: ${t.status}</span>
          <span class="pill">Product: ${t.product_description}</span>
          <span class="pill">Pickup: ${t.pickup_location}</span>
          <span class="pill">Drop: ${t.drop_location}</span>
        </div>`;

      byId("courierInfo").textContent = `${t.courier_name} • ${t.courier_phone}`;
      
      byId("timeline").innerHTML = t.timeline
        .map(
          step => `
          <div class="timecard">
            <div class="dot"></div>
            <div>
              <strong>${new Date(step.time).toLocaleTimeString()}</strong>
              <div class="sub">${step.status}</div>
            </div>
          </div>`
        )
        .join("");
    } catch (e) { 
      alert('Tracking ID not found');
      console.error(e); 
    }
  });

  // --- Auth overlay ---
  const loginTab = byId("loginTab");
  const registerTab = byId("registerTab");
  const loginForm = byId("loginForm");
  const registerForm = byId("registerForm");

  const openAuth = (which = "login") => {
    byId("authTitle").textContent = which === "login" ? "Login" : "Create Your Account";
    loginForm.style.display = which === "login" ? "block" : "none";
    registerForm.style.display = which === "login" ? "none" : "block";
    show("authOverlay");
  };

  byId("openLogin").addEventListener("click", () => openAuth("login"));
  byId("openRegister").addEventListener("click", () => openAuth("register"));
  loginTab.addEventListener("click", () => openAuth("login"));
  registerTab.addEventListener("click", () => openAuth("register"));

  const merchantBtn = byId("asMerchant");
  const courierBtn = byId("asCourier");
  merchantBtn.addEventListener("click", () => {
    merchantBtn.classList.add("primary");
    courierBtn.classList.remove("primary");
  });
  courierBtn.addEventListener("click", () => {
    courierBtn.classList.add("primary");
    merchantBtn.classList.remove("primary");
  });

  byId("doLogin").addEventListener("click", async () => {
    const email = byId("loginUser").value.trim();
    const password = byId("loginPass").value;
    
    try {
      const data = await apiCall('/auth/login', 'POST', { email, password });
      if (data.auth) {
        token = data.token;
        localStorage.setItem('token', token);
        currentUser = data.user;
        alert(`Welcome back, ${currentUser.name}!`);
        hide("authOverlay");
        checkAuth();
      }
    } catch (e) { console.error(e); }
  });

  byId("doRegister").addEventListener("click", async () => {
    const name = byId("rName").value.trim();
    const email = byId("rEmail").value.trim();
    const password = byId("rPass").value;
    const phone = byId("rPhone").value.trim();
    // Address is optional but good to have, purely optional in backend? No, backend needs it? 
    // Backend schema: name, email, password, role are required. Phone/Address are not strictly required by schema but created.
    // Let's make them required for better data quality or just warn. 
    // Backend routes/auth.js checks: if (!name || !email || !password || !role)
    const address = byId("rAddr").value.trim();
    const role = byId("asMerchant").classList.contains("primary") ? "merchant" : "courier";

    if (!name || !email || !password) {
      alert("Please fill in Name, Email, and Password.");
      return;
    }

    try {
      const data = await apiCall('/auth/register', 'POST', { name, email, password, role, phone, address });
      if (data.auth) {
        token = data.token;
        localStorage.setItem('token', token);
        currentUser = data.user;
        alert(`Account created! Welcome ${currentUser.name}`);
        hide("authOverlay");
        checkAuth();
      }
    } catch (e) { console.error(e); }
  });

  const checkAuth = async () => {
    if (!token) return;
    try {
      const user = await apiCall('/auth/me');
      currentUser = user;
      // Update UI for logged in user
      byId("openLogin").style.display = 'none';
      byId("openRegister").textContent = 'Logout';
      byId("openRegister").classList.remove('primary');
      byId("openRegister").onclick = () => {
        localStorage.removeItem('token');
        location.reload();
      };
      
      // Show appropriate dashboard
      if (user.role === 'merchant') {
        document.querySelector('[data-target="merchant"]').click();
      } else {
        document.querySelector('[data-target="courier"]').click();
      }
      fetchData();
    } catch (e) {
      localStorage.removeItem('token');
    }
  };
  
  checkAuth();

  $$("[data-open='register']").forEach(btn =>
    btn.addEventListener("click", () => openAuth("register"))
  );

  // --- Place bid (courier) ---
  const placeBid = async (id) => {
    const price = prompt("Enter your bid price (৳):");
    const eta = prompt("Enter ETA (e.g. 2 hours):");
    if (!price || !eta) return;
    
    try {
      await apiCall(`/bids/${id}/proposals`, 'POST', {
        courierId: currentUser._id,
        price: Number(price),
        eta
      });
      alert('Bid submitted!');
    } catch (e) { console.error(e); }
  };

  availableBidsEl.addEventListener("click", event => {
    const btn = event.target.closest("[data-bid]");
    if (!btn) return;
    placeBid(btn.dataset.bid);
  });
  
  // --- AI Chatbox ---
  const chatBtn = byId("aiChatBtn");
  const chatWindow = byId("aiChatWindow");
  const closeChat = byId("closeChat");
  const sendMsgBtn = byId("sendMsg");
  const userMsgInput = byId("userMsg");
  const chatMessages = byId("chatMessages");

  if (chatBtn) {
    chatBtn.addEventListener("click", () => {
      chatWindow.classList.add("show");
      userMsgInput.focus();
    });
    closeChat.addEventListener("click", () => chatWindow.classList.remove("show"));
  }

  const addMessage = (text, sender) => {
    const div = document.createElement("div");
    div.className = `msg ${sender}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const handleSend = async () => {
    const text = userMsgInput.value.trim();
    if (!text) return;
    
    addMessage(text, "user");
    userMsgInput.value = "";
    
    // Simulate loading or call backend
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      addMessage(data.reply, "ai");
    } catch (e) {
      addMessage("Sorry, I'm having trouble connecting.", "ai");
    }
  };

  if (sendMsgBtn) {
    sendMsgBtn.addEventListener("click", handleSend);
    userMsgInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSend();
    });
  }

})();


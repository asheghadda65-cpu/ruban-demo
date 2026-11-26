// Ruban customer demo: local-only sample data, no Supabase and no real accounts.
document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    const customer = { name: 'نگار محمدی', phone: '۰۹۱۲۱۲۳۴۵۶۷', email: 'negar@example.com' };
    let selectedAtelier = null;
    let selectedNotification = null;
    let selectedChat = 'atelier-1';
    let recording = null;
    let recorder = null;
    let audioChunks = [];

    const orders = [
        { id: 1, title: 'پیراهن مجلسی سبز', order_type: 'custom', status: 'in_progress', created_at: '2026-11-18', requested_delivery_date: '2026-12-15' },
        { id: 2, title: 'مانتو رسمی', order_type: 'semi_custom', status: 'ready_for_delivery', created_at: '2026-11-10', requested_delivery_date: '2026-11-28' },
        { id: 3, title: 'تغییر سایز کت', order_type: 'alteration', status: 'completed', created_at: '2026-10-20', requested_delivery_date: '2026-11-01' }
    ];
    const notifications = [
        { id: 1, title: 'به‌روزرسانی سفارش پیراهن مجلسی', body: 'وضعیت سفارش شما به «در حال انجام» تغییر کرد. مزون در حال آماده‌سازی لباس شماست.', date: '۱۴۰۵/۰۸/۲۷', unread: true },
        { id: 2, title: 'سفارش شما آماده تحویل است', body: 'سفارش مانتو رسمی آماده تحویل است. برای هماهنگی با مزون تماس بگیرید.', date: '۱۴۰۵/۰۸/۲۲', unread: true },
        { id: 3, title: 'به روبان خوش آمدید', body: 'از اینکه روبان را برای تجربه دوخت لباس انتخاب کرده‌اید سپاسگزاریم.', date: '۱۴۰۵/۰۸/۱۵', unread: false }
    ];
    const ateliers = [
        { id: 'atelier-1', name: 'مزون آوینا', description: 'طراحی و دوخت لباس‌های مجلسی، عروس و لباس‌های سفارشی با تمرکز بر جزئیات و ظرافت.' },
        { id: 'atelier-2', name: 'خانه مد ترمه', description: 'ارائه خدمات طراحی لباس، دوخت مانتو و پوشاک رسمی و نیمه‌رسمی.' },
        { id: 'atelier-3', name: 'مزون ماه‌چهره', description: 'تخصص در لباس عروس، فرمالیته و لباس‌های مناسب مراسم.' }
    ];
    const chats = {
        'atelier-1': { name: 'مزون آوینا', messages: [{ text: 'سلام، به گفت‌وگوی نمایشی روبان خوش آمدید.', mine: false, time: '۱۶:۲۰' }, { text: 'برای سفارش لباس مجلسی راهنمایی می‌خواستم.', mine: true, time: '۱۶:۲۴' }, { text: 'با کمال میل. می‌توانید فرم سفارش را تکمیل کنید.', mine: false, time: '۱۶:۲۶' }] },
        'atelier-2': { name: 'خانه مد ترمه', messages: [{ text: 'سلام، نمونه‌کارهای ما در بخش معرفی مزون قابل مشاهده است.', mine: false, time: 'دیروز' }] }
    };
    const statusLabels = { submitted: 'در انتظار بررسی مزون', accepted: 'تأیید شده', in_progress: 'در حال انجام', ready_for_delivery: 'آماده تحویل', completed: 'تکمیل‌شده' };
    const typeLabels = { custom: 'دوخت سفارشی', semi_custom: 'دوخت نیمه‌سفارشی', alteration: 'تعمیر و تغییر لباس' };
    const sections = ['home','tracking','notifications','messages','notificationDetail','ateliers','atelierDetail','orderForm','profile'];

    function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
    function faDate(value) { return new Date(value + 'T12:00:00').toLocaleDateString('fa-IR'); }
    function showSection(name) {
        if (!sections.includes(name)) return;
        sections.forEach(s => { const node = $(s === 'home' ? 'homeView' : s + 'View'); if (node) node.hidden = s !== name; });
        document.querySelectorAll('.customer-nav [data-section]').forEach(n => n.classList.toggle('active', n.dataset.section === name || (name === 'notificationDetail' && n.dataset.section === 'notifications') || (name === 'atelierDetail' && n.dataset.section === 'ateliers')));
        sessionStorage.setItem('rubanCustomerActiveSection', name === 'notificationDetail' ? 'notifications' : name === 'atelierDetail' ? 'ateliers' : name);
        document.documentElement.classList.remove('restore-customer-section');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    document.querySelectorAll('[data-section]').forEach(n => n.addEventListener('click', e => { e.preventDefault(); showSection(n.dataset.section); }));
    $('notificationButton')?.addEventListener('click', () => showSection('notifications'));
    $('customer-logout')?.addEventListener('click', () => alert('در نسخه نمایشی نیازی به ورود یا خروج از حساب نیست.'));

    function setCustomerName() {
        ['customerName','orderFormCustomerName','profileDisplayName'].forEach(id => { if ($(id)) $(id).textContent = customer.name; });
        ['headerAvatar','sidebarAvatar','profileAvatar'].forEach(id => { if ($(id)) $(id).textContent = customer.name.charAt(0); });
        if ($('profileName')) $('profileName').value = customer.name;
        if ($('profilePhone')) $('profilePhone').value = customer.phone;
        if ($('profileEmail')) $('profileEmail').value = customer.email;
    }
    setCustomerName();

    function renderOrders() {
        const active = orders.filter(o => ['submitted','accepted','in_progress','ready_for_delivery'].includes(o.status));
        $('activeOrdersCount').textContent = active.length.toLocaleString('fa-IR');
        $('completedOrdersCount').textContent = orders.filter(o => o.status === 'completed').length.toLocaleString('fa-IR');
        const render = (container, list) => {
            if (!container) return;
            container.replaceChildren();
            if (!list.length) { container.append(el('div','empty-state','سفارشی برای نمایش وجود ندارد.')); return; }
            list.forEach(o => {
                const card = el('div','empty-state compact');
                card.append(el('h3','',o.title), el('p','','نوع سفارش: ' + (typeLabels[o.order_type] || 'نامشخص')), el('p','','وضعیت: ' + (statusLabels[o.status] || o.status)), el('small','','تاریخ ثبت: ' + faDate(o.created_at)), el('small','','تاریخ تحویل درخواستی: ' + faDate(o.requested_delivery_date)));
                container.append(card);
            });
        };
        render($('latestOrdersContainer'), active.slice(0, 3));
        render($('allOrdersContainer'), orders);
    }
    renderOrders();

    function renderNotifications() {
        const container = $('allNotificationsContainer'); if (!container) return;
        container.replaceChildren();
        notifications.forEach(n => {
            const card = el('article','empty-state compact demo-notification-item');
            card.append(el('h3','',n.title), el('p','',n.body), el('small','',n.date + (n.unread ? ' • جدید' : '')));
            card.addEventListener('click', () => openNotification(n.id));
            container.append(card);
        });
        const unread = notifications.filter(n => n.unread).length;
        if ($('headerUnreadNotificationsCount')) { $('headerUnreadNotificationsCount').hidden = unread === 0; $('headerUnreadNotificationsCount').textContent = unread.toLocaleString('fa-IR'); }
    }
    function openNotification(id) {
        const n = notifications.find(x => x.id === id); if (!n) return;
        selectedNotification = n; n.unread = false;
        $('notificationDetailTitle').textContent = n.title;
        $('notificationDetailStatus').textContent = 'اعلان نمایشی';
        $('notificationDetailDate').textContent = n.date;
        $('notificationDetailBody').textContent = n.body;
        renderNotifications(); showSection('notificationDetail');
    }
    $('notificationBackButton')?.addEventListener('click', () => showSection('notifications'));
    renderNotifications();

    function renderAteliers(query = '') {
        const box = $('atelierSearchResults'); if (!box) return;
        box.replaceChildren();
        const list = ateliers.filter(a => a.name.includes(query.trim()) || a.description.includes(query.trim()));
        if (!list.length) { box.append(el('div','empty-state','مزونی با این مشخصات پیدا نشد.')); return; }
        list.forEach(a => {
            const card = el('div','empty-state compact demo-atelier-item');
            card.append(el('h3','',a.name), el('p','',a.description), el('small','','مشاهده جزئیات مزون ←'));
            card.addEventListener('click', () => openAtelier(a.id)); box.append(card);
        });
    }
    function openAtelier(id) {
        selectedAtelier = ateliers.find(a => a.id === id); if (!selectedAtelier) return;
        $('atelierDetailName').textContent = selectedAtelier.name;
        $('atelierDetailTitle').textContent = selectedAtelier.name;
        $('atelierDetailDescription').textContent = selectedAtelier.description;
        $('atelierDetailCreatedAt').textContent = '۱۴۰۵';
        $('atelierOrderForm').hidden = true; $('atelierOrderForm').reset();
        showSection('atelierDetail');
    }
    $('atelierSearchButton')?.addEventListener('click', () => renderAteliers($('atelierSearchInput').value));
    $('atelierSearchInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') renderAteliers(e.target.value); });
    $('atelierDetailBackButton')?.addEventListener('click', () => showSection('ateliers'));
    $('atelierDetailOrderButton')?.addEventListener('click', () => { $('atelierOrderForm').hidden = false; $('atelierOrderTitle').focus(); });
    $('atelierOrderCancelButton')?.addEventListener('click', () => { $('atelierOrderForm').hidden = true; $('atelierOrderForm').reset(); });
    $('atelierOrderForm')?.addEventListener('submit', e => {
        e.preventDefault();
        const title = $('atelierOrderTitle').value.trim();
        if (!title || !$('atelierOrderType').value) { $('atelierOrderMessage').textContent = 'عنوان و نوع سفارش را وارد کنید.'; return; }
        $('atelierOrderMessage').textContent = 'این سفارش فقط در نسخه نمایشی ثبت شد و به مزون واقعی ارسال نمی‌شود.';
        $('atelierOrderSubmitButton').disabled = true;
    });
    renderAteliers();

    function renderChat(id) {
        selectedChat = id; const chat = chats[id]; if (!chat) return;
        $('customer-chat-placeholder').hidden = true; $('customer-chat-content').hidden = false;
        $('customer-chat-name').textContent = chat.name;
        const box = $('customer-chat-messages'); box.replaceChildren();
        chat.messages.forEach(m => { const item = el('div','demo-chat-message' + (m.mine ? ' mine' : ''),m.text); item.append(el('small','',m.time)); box.append(item); });
        box.scrollTop = box.scrollHeight;
    }
    function renderChatList() {
        const list = $('customer-chat-list'); if (!list) return; list.replaceChildren();
        Object.entries(chats).forEach(([id,c]) => {
            const b = el('button','nav-item',c.name + ' — ' + (c.messages.at(-1)?.text || 'گفت‌وگو'));
            b.type = 'button'; b.style.width = '100%'; b.style.marginBottom = '8px'; b.addEventListener('click', () => renderChat(id)); list.append(b);
        });
        if (chats[selectedChat]) renderChat(selectedChat);
    }
    $('customer-chat-form')?.addEventListener('submit', e => {
        e.preventDefault(); const input = $('customer-chat-input'); const text = input.value.trim(); if (!text) return;
        chats[selectedChat].messages.push({ text, mine: true, time: new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}) });
        input.value = ''; renderChat(selectedChat); $('customer-chat-status').textContent = 'پیام به‌صورت آزمایشی در همین مرورگر نمایش داده شد؛ برای مزون ارسال نشد.';
    });
    $('atelierDetailMessageButton')?.addEventListener('click', () => { showSection('messages'); renderChat(selectedAtelier?.id === 'atelier-2' ? 'atelier-2' : 'atelier-1'); });
    $('customer-chat-record')?.addEventListener('click', async () => {
        const status = $('customer-chat-status');
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { status.textContent = 'ضبط صدا در این مرورگر پشتیبانی نمی‌شود.'; return; }
        try {
            if (recorder?.state === 'recording') { recorder.stop(); return; }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recorder = new MediaRecorder(stream); audioChunks = [];
            recorder.ondataavailable = e => { if (e.data.size) audioChunks.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: recorder.mimeType || 'audio/webm' });
                const url = URL.createObjectURL(blob); const audio = document.createElement('audio'); audio.controls = true; audio.src = url;
                $('customer-chat-messages').append(audio); stream.getTracks().forEach(t => t.stop());
                status.textContent = 'صدای ضبط‌شده فقط در همین صفحه قابل پخش است و ارسال نمی‌شود.';
                $('customer-chat-record').textContent = 'ضبط صدا';
            };
            recorder.start(); $('customer-chat-record').textContent = 'پایان ضبط'; status.textContent = 'در حال ضبط صدا...';
        } catch (err) { status.textContent = 'دسترسی به میکروفون داده نشد.'; }
    });
    renderChatList();

    $('profileSaveButton')?.addEventListener('click', () => {
        const name = $('profileName').value.trim();
        if (!name) { $('profileMessage').textContent = 'نام و نام خانوادگی را وارد کنید.'; return; }
        customer.name = name; customer.email = $('profileEmail').value.trim(); setCustomerName();
        $('profileMessage').textContent = 'تغییرات فقط در همین نسخه نمایشی اعمال شد.';
    });
    $('profileCancelButton')?.addEventListener('click', () => { setCustomerName(); $('profileMessage').textContent = ''; });
    $('profileAvatarSelectButton')?.addEventListener('click', () => $('profileAvatarInput').click());
    $('profileAvatarInput')?.addEventListener('change', e => {
        const file = e.target.files?.[0]; if (!file) return;
        if (!file.type.startsWith('image/')) { $('profileAvatarMessage').textContent = 'لطفاً یک فایل تصویری انتخاب کنید.'; return; }
        const url = URL.createObjectURL(file); $('profileAvatarImage').src = url; $('profileAvatarImage').hidden = false; $('profileAvatar').hidden = true; $('profileAvatarDeleteButton').hidden = false;
        $('profileAvatarMessage').textContent = 'تصویر فقط در این مرورگر نمایش داده می‌شود.';
    });
    $('profileAvatarDeleteButton')?.addEventListener('click', () => { $('profileAvatarImage').hidden = true; $('profileAvatar').hidden = false; $('profileAvatarInput').value = ''; $('profileAvatarDeleteButton').hidden = true; });

    $('demoOrderSaveButton')?.addEventListener('click', () => {
        const checked = [...document.querySelectorAll('input[name="orderClothingType"]:checked')].map(x => x.value);
        const values = [...document.querySelectorAll('#orderFormView input, #orderFormView select')].filter(x => x.type !== 'checkbox').filter(x => x.value.trim());
        if (!values.length && !checked.length) { $('demoOrderFormMessage').textContent = 'فرم هنوز تکمیل نشده است. می‌توانید چند فیلد را برای آزمایش پر کنید.'; return; }
        $('demoOrderFormMessage').textContent = 'فرم آزمایشی شما با ' + (values.length + checked.length).toLocaleString('fa-IR') + ' مورد ورودی، فقط در همین صفحه ثبت نمایشی شد. اطلاعاتی به سرور ارسال نشده است.';
    });
    $('demoOrderResetButton')?.addEventListener('click', () => { document.querySelectorAll('#orderFormView input, #orderFormView select').forEach(x => { if (x.type === 'checkbox') x.checked = false; else x.value = ''; }); $('demoOrderFormMessage').textContent = 'فرم پاک شد.'; });

    // Restore always to the demo home page; do not inherit a logged-in user's previous section.
    sessionStorage.removeItem('rubanCustomerActiveSection');
    showSection('home');
});

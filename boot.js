// Đọc kích thước bản đồ đã chọn ở màn hình chính trước khi nạp core.js (mọi module dùng chung W×H).
(function(){try{const s=JSON.parse(localStorage.getItem('loan12.setup')||'null');if(s&&typeof s.size==='string')window.LOAN12_MAP_SIZE=s.size;}catch(e){}})();

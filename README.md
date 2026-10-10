# Loạn 12 Sứ Quân — Browser demo

## Mới nhất: điều khiển kiểu AoE II + màn hình chính (giai đoạn 5)

**Vì sao trước đây chuột trái "không dùng được":** bảng lệnh bên phải bị dựng lại khoảng 3 lần mỗi giây (mỗi khi một dân phu nhặt thêm gỗ/lương), nên nút bị thay mới ngay giữa lúc bấm và mất cú nhấp (thử bằng chuột thật: chỉ 4/20 lần bấm ăn). Ngoài ra nhấp trái lên đất/địch chỉ bỏ chọn, chế độ đặt nhà bị kẹt im lặng khi đặt sai chỗ, bản đồ nhỏ bị ẩn cùng bảng lệnh. Nay nút bảng lệnh ăn ngay khi nhấn chuột (20/20), bảng không dựng lại khi đang bấm/rê chuột.

**Chuột:** trái = chọn · kéo trái = khung chọn · nhấp đúp = mọi quân cùng loại trên màn hình · Ctrl+nhấp = thêm/bớt · Shift = chọn thêm · **phải = lệnh theo ngữ cảnh** (đi, đánh, khai thác, xây móng, sửa, lên thuyền, đổ quân, đánh cá, mang hàng về, điểm tập kết). Tùy chọn **"Lệnh bằng chuột trái"** (F1 → ô đánh dấu, được nhớ lại) cho phép nhấp trái lên đất/địch/tài nguyên để ra lệnh. Con trỏ đổi theo ngữ cảnh: kiếm (địch), rìu (gỗ), cuốc (đá/vàng/sắt), liềm (lương), búa (công trình hỏng/đang xây), neo (thuyền).

**Phím:** Ctrl+1…9 lưu đạo quân, 1…9 gọi (nhấn 2 lần để đưa camera tới) · H về Đại Bản Doanh · . dân phu rảnh · A tiến công · G giữ vị trí (hoặc mở/đóng cổng) · X dừng · Delete giải tán (Đại Bản Doanh được bảo vệ) · Esc bỏ chọn/hủy · Space toàn quân · U đổ quân · P tạm dừng · F1 bảng phím tắt. Bản đồ nhỏ luôn hiện ở góc phải: nhấp/kéo trái để đưa camera, nhấp phải để điều quân tới.

**Màn hình chính** (thẻ *Thiết lập trận*): chọn bản đồ có ảnh xem trước (7 bản đồ + Ngẫu nhiên; mới: *Ải Đèo Tam Điệp*, *Quần Đảo Vân Đồn*, *Bình Nguyên Gia Viễn*), kích thước (Tiêu chuẩn 84×60, Lớn 105×75, Rất lớn 126×90 — đổi kích thước sẽ tải lại trang), sứ quân của bạn, tài nguyên khởi đầu (Thấp/Tiêu chuẩn/Cao/Giàu có), số đối thủ AI (1–11) cùng phe và độ khó (Dễ/Thường/Khó) của từng đối thủ. Các thẻ khác: *Sứ quân*, *Nhiều người (LAN)*, *Binh chủng & hướng dẫn*. Thiết lập được nhớ lại giữa các lần mở.

Tệp mới: `boot.js`, `setup.js`, `controls.js`, `input.js`, `menu.js`, `menu.css`, kiểm thử `controls-setup.test.cjs`.

## Mới nhất: tường thành, thủy quân, hiệu ứng chiến trận (giai đoạn 4)

Chơi một người: mở thẳng `index.html` (file://), không cần máy chủ. Máy chủ `node server.cjs` chỉ cần cho chơi mạng.

**Tường thành (kiểu AoE)** — mở *Kiến thiết*, chọn loại tường, **nhấn giữ chuột trái và kéo** để xây cả tuyến (bám ô, thẳng hoặc chéo 45°, tối đa 40 ô; ô đỏ là không xây được). Giữ Shift khi thả chuột để xây tiếp. Esc / chuột phải để hủy.

| Loại | Giá mỗi ô | HP | Giáp | Ghi chú |
|---|---|---|---|---|
| Hàng Rào Cọc Tre | 6 Gỗ | 220 | 1 | rẻ, nhanh; sợ thuyền lửa |
| Tường Đất Nện | 3 Gỗ + 8 Đá | 460 | 3 | |
| Tường Đá | 16 Đá | 850 | 5 | cần Đại Bản Doanh cấp 2 |
| Cổng Thành | 30 Gỗ + 30 Đá | 700 | 4 | đặt thẳng lên đoạn tường có sẵn |
| Vọng Lâu Trên Tường | 40 Gỗ + 60 Đá | 620 | 4 | tự bắn tên tầm 7 |

- Cổng tự mở cho quân mình, chặn quân địch. Chọn cổng → *Khóa cổng* (phím **G**) để không ai qua được.
- Quân bị tường chặn sẽ tự đánh đoạn tường cản đường. Máy bắn đá ×4, voi ×2,5–3, thuyền húc ×3 sát thương lên tường; cung nỏ chỉ ×0,25.
- Sửa: chọn Dân Phu → chuột phải lên tường/nhà bị hư (tốn 50% chi phí theo phần hư hại). Nút *Phá dỡ* để dỡ đoạn tường của mình.
- AI dựng tường đá/cọc, cổng và vọng lâu quanh căn cứ ở giữa trận.

**Thủy quân** — Thủy Xưởng đóng: Thuyền Chài (đánh cá), Thuyền Mui (chở 6 bộ binh), Thuyền Cung Thủ, Thuyền Húc Mũi Sắt (×2,2 khi húc thuyền), Soái Hạm Rồng (thuyền gần soái hạm +15% sát thương), cùng các thuyền cũ.
- Đánh cá: chọn Thuyền Chài → chuột phải lên *Bãi cá* (vòng sóng, cá nhảy trên mặt nước). Thuyền tự chở Lương về Thủy Xưởng.
- Lên thuyền: chọn bộ binh → chuột phải lên Thuyền Mui (hoặc Thuyền Lầu).
- Đổ quân: chọn thuyền → chuột phải lên bờ đất bên kia; thuyền tự chạy tới bờ gần nhất rồi cho quân lên bộ. Phím **U** đổ quân ngay tại chỗ (thuyền phải sát bờ).
- Trần Lãm (Bố Hải): thuyền rẻ hơn 15%, nhanh hơn, hào quang thủy chiến vẫn giữ.
- AI dựng Thủy Xưởng và đóng thuyền khi bản đồ có nước.

**Đồ họa** — thuyền và máy bắn đá vẽ 8 hướng (mái chèo, buồm cánh dơi màu phe, mắt thuyền, đầu rồng, sóng sau đuôi); tên/nỏ/lao/đá bay vòng cung có bóng; bụi khi hành quân và xung phong; khói, lửa trên nhà hư; nước bắn tung; lính ngã và mờ dần, thuyền chìm; gạch vụn khi tường sập. Tướng cưỡi voi được phóng to.

File mới: `walls.js`, `navy.js`, `vehicle-sprites.js`, `fort-art.js`, `fx.js`, `fortress-navy.test.cjs`, `vehicles-fx.test.cjs`.

## Mới nhất: nhân vật 8 hướng (giai đoạn 2 đồ họa)

- Bộ binh, dân phu, sĩ phu, danh tướng và chiến tượng được dựng như "con rối 2.5D": quay đủ **8 hướng** theo hướng đi hoặc hướng mục tiêu đang đánh.
- Có nhịp **bước đi**, **đòn đánh** riêng từng binh khí (đâm kích, chém đao, giương cung, bắn nỏ, phóng lao, bổ rìu khai thác), **thở/đứng nghỉ** và tư thế hiệu lệnh của tướng.
- Trang phục cách điệu Đại Cồ Việt: nón lá, mũ mây, khăn quấn, áo giao lĩnh, giáp phiến, khiên tròn; **đai/khăn/cờ theo màu phe**. Danh tướng có áo choàng, cờ hiệu và mũ theo phe.
- Bóng đổ bám theo độ dốc mặt đất, **vòng chọn ôm theo địa hình**, thanh máu nhỏ trên đầu.
- Khung hình được vẽ sẵn một lần vào **atlas** (canvas ẩn) rồi dán lại mỗi khung hình (`unit-sprites.js`). Thuyền và máy bắn đá giữ hình cũ. Kiểm thử: `node --test unit-sprites.test.cjs`.

## Mới nhất: đồ họa 2.5D kiểu Age of Empires (giai đoạn 1)

- Địa hình có **độ cao thật**: đồi nhô lên thành gò tròn, lòng sông trũng xuống, bờ dốc thoai thoải. Ánh sáng chiếu từ phía trái màn hình nên sườn đồi có mặt sáng/mặt tối, chân dốc có bóng.
- Ô đất **hòa màu vào nhau** ở mép (cỏ, bùn, sỏi, bãi cát ven sông), cỏ có mảng xanh/vàng tự nhiên, nước có vệt sóng lấp lánh chuyển động.
- Công trình **đổ bóng** theo hướng nắng; quân và nhà đứng đúng độ cao của mặt đất. Phía trên màn hình có lớp sương nhẹ tạo chiều sâu.
- Camera mượt: lăn chuột **phóng to về đúng chỗ con trỏ**, giữ **chuột giữa và kéo** để di chuyển bản đồ, đưa chuột sát **mép màn hình** để cuộn, phím WASD/mũi tên có gia tốc.
- Hiệu năng: mặt đất được vẽ sẵn thành từng mảng 12×12 ô và lưu lại (`terrain25d.js`), không vẽ lại từng ô mỗi khung hình.
- Độ cao chỉ là hiển thị: đường đi, giao tranh, kinh tế không đổi. Kiểm thử riêng: `node --test terrain25d.test.cjs`.

## Mới nhất: khai thác và vận chuyển thật

**Không còn tự cộng bất kỳ loại tài nguyên nào theo thời gian.** Kho đầu trận là vốn khởi đầu cố định. Rừng gỗ, mỏ đá/vàng/sắt có trữ lượng hữu hạn; lương lấy từ ruộng. Hàng phải được Dân Phu khai thác và mang về nhà chính, nhà dân hoặc Kho Tài Nguyên hoàn thành mới cộng vào kho.

1. Bấm **Dân phu** ở bảng phải (có 4 thợ đầu trận).
2. Chuột phải vào **rừng, mỏ hoặc Nông Trang** để phân công. Sau lệnh ban đầu, thợ tự lặp chuyến, không cần click cho từng nhát cuốc.
3. Mỗi thợ mang tối đa **20**. Chọn thợ để xem trạng thái và hàng; dùng **Mang hàng về kho** hoặc **Dừng** khi cần.
4. Tuyển thêm Dân Phu tại Nhà Dân: **40 Lương, 1 dân số**. Nhà Dân có nút phân công thợ trong 10 ô đến loại tài nguyên mong muốn, không tạo ra hàng tự động.
5. Xây **Kho Tài Nguyên** gần rừng/mỏ để giảm quãng đường: 80 Gỗ + 40 Đá, 14 giây. Chỉ kho hoàn thành nhận hàng.

Cây hết gỗ thành gốc cây, ô đất được giải phóng. Mỏ hết vẫn có dấu mỏ cạn. Thợ tìm nguồn cùng loại tiếp cận được; nếu không còn thì chờ. Ruộng có 1.000 Lương ban đầu, mỗi lần nâng cấp bổ sung 500; không tự tái sinh.

Đổi ngành: phải nộp hàng cũ trước, không đổi gỗ thành đá. Thợ chết mất hàng đang mang. Không có đường hoặc kho nhận hàng thì giữ hàng và chờ, tuyệt đối không cộng kho từ xa. Nghiên cứu Hậu cần tăng tốc độ khai thác 10%/bậc, không tăng trữ lượng.

Thu phục không tạo thu nhập thụ động: tài nguyên từ mỏ gắn vùng đồng minh được nộp 70%, phần còn lại nuôi quân hàng. Trảm vẫn thưởng kho một lần và tạo 6 dân phu rảnh để bạn giao việc, không có nguồn đá tự tăng.

Kiểm thử bản hiện tại: `node --test tests.cjs progression.test.cjs economy.test.cjs`. Module mới `economy.js` được nạp sau `progression.js`; phần diễn giải sản lượng tự động ở lịch sử bên dưới đã được thay thế bởi cơ chế này.

Chạy `node server.cjs` trong thư mục này, mở http://127.0.0.1:4180. Không cần Unity, npm install hoặc Internet. Game Emberhold ở cổng 4173 không bị thay đổi.

Chuột trái/kéo chọn quân, Shift thêm quân, chuột phải ra lệnh đi/đánh. Space chọn quân đất liền, A bật tiến công rồi click đất; khi đang chọn quân dùng phím mũi tên thay A để kéo camera. Lăn chuột zoom, P tạm dừng. Chọn số phe trên bảng phải để xem vùng đất; chọn công trình trên bản đồ để tuyển/nâng cấp. Đóng hướng dẫn bằng nút Dựng cờ.

Đại Bản Doanh cấp II mở nâng nhà cấp II. Thu phục Đường Lâm mở nỏ và nghiên cứu đá ong, Kiều Thuận mở tượng, Bố Hải Khẩu mở Trần Lãm. Hai Tướng tối đa gồm hàng chờ; Đinh Bộ Lĩnh có sẵn. Kinh tế tự cộng mỗi giây; thu phục giữ 70% sản lượng vùng mới, trảm thưởng 1000 lương/600 vàng và sản lượng từ 6 phu đá. Máy bắn đá tiêu tốn sắt. Thuyền Mui chở tối đa 6 quân bộ gần bờ. Bè Trần Lãm cần có thuyền địch trong vùng nước đi tới được.

Đây là prototype, không phải tái dựng lịch sử. Một số chỉ số chưa có trong thiết kế được dùng tạm: nỏ 4×3 sát thương, aura 6 ô, Đinh +15% tốc độ và hồi 2 HP/s ngoài giao tranh, gầm +4 giáp chém/10s; Trần +20% tốc độ bắn. Sửa dữ liệu trong core.js.

Giới hạn: tường có tuyến cố định, không phá được; chưa có lưu trận, sương mù, âm thanh, thủy triều, kỵ binh; AI cơ bản và chưa có nền kinh tế khai thác đầy đủ cho địch. Trần Lãm mới nhắm thuyền (chưa nhắm cảng). 12 vùng đất có màu riêng, chỉ các phe đã có thiết kế được gắn mở khóa đặc biệt. Không dùng tài nguyên Warcraft. Đồ họa Canvas được vẽ bằng mã.

## Lịch sử bản phát triển chi tiết — trước thay đổi kinh tế vật lý

- **Kiến thiết:** 9 loại công trình, đặt nhà trên bản đồ với kiểm tra diện tích/địa hình/phạm vi 8 ô; nhà dân, nông trang và lò rèn mới. Xây 12–24 giây; nâng cấp II/III mất 18/32 giây. Trong lúc thi công không tuyển/nghiên cứu. Hủy công việc hoàn 75%; bị phá mất chi phí công việc đang làm.
- **Ba cấp:** nhà chính mở trần cấp cho các nhà khác; mỗi lần nâng +35% HP gốc. Quân mới từ nhà cấp II/III nhận +10%/+20% HP và sát thương. Nhà quân sự tuyển nhanh hơn 15% mỗi cấp. Tướng không nhận thưởng bậc doanh trại.
- **Dân số:** nhà chính 20/30/40; nhà dân 8/12/16. Tính cả quân trong thuyền và hàng chờ. Vượt trần khi mất nhà/thu phục chỉ chặn tuyển mới. Tướng dùng 3 dân, tượng 4, máy bắn đá/thuyền chiến/thuyền mui 3, quân khác 1; bè triệu hồi 0.
- **Sản xuất hộ dân:** chọn Lương/Gỗ/Đá/Vàng/Sắt ngay tại Nhà Dân, thêm 0,6 tài nguyên/s mỗi cấp. Nông trang thêm 2/3/4 Lương/s. Chưa có mô hình thợ đi khai thác vật lý.
- **Nghiên cứu:** rèn binh khí, giáp, đầu tên, hậu cần, quân chế có 2 bậc yêu cầu nhà II/III. Áp dụng lên cả quân đã tuyển; dùng chỉ số thực trong chiến đấu. Không thể nghiên cứu trùng ở hai nhà. Đá ong cần thu phục Đường Lâm và 25 giây nghiên cứu.
- **Tướng:** cấp 1–5, mốc XP 0/100/250/450/700. XP từ hạ quân/phá nhà (40/120), chia cho tướng cùng phe trong 8 ô. Mỗi cấp +12% HP gốc, +8% sát thương gốc và 1 điểm thiên phú. Thống lĩnh tăng aura; Dũng lược tăng sát thương/giáp; Mưu lược giảm hồi kỹ năng. Mỗi nhánh tối đa 3 điểm, toàn bộ 4 điểm khi cấp 5.
- **Tái tuyển:** giữ XP/cấp/thiên phú trong cùng trận, hồi kỹ năng chờ 30 giây. Vẫn áp dụng trần 2 Tướng và cấm bản sao.
- **Binh thư:** nút trên thanh đầu trang mở bảng công trình, chi phí, binh chủng, chỉ số, công nghệ và tướng. Mở bảng sẽ tạm dừng trận; đóng trả lại trạng thái trước đó. Toàn bộ thông số mới là cân bằng thử nghiệm.

Chọn **Kiến thiết → loại nhà → click ô xanh** để xây; Esc/chuột phải hủy đặt. Chọn nhà hoặc tướng để xem và phát triển. Có giàn giáo/thanh tiến độ trong lúc thi công; cấp III có viền đá vàng.

Kiểm thử: `node --test tests.cjs progression.test.cjs`. 10 ca lõi nền + 14 ca tích hợp module phát triển. Bản chơi nạp `core.js` rồi `progression.js`; bản Unity riêng và Emberhold không thay đổi.

## Giai đoạn 3 · Bản sắc 12 sứ quân

**Tạo hình:** mỗi sứ quân có quân phục riêng (màu áo, màu giáp phiến, kiểu mũ, hoa văn khiên, hình và màu cờ). Khoảng 1/5 quân và toàn bộ quân độc quyền mang cờ hiệu của phe. Sprite được nướng vào atlas theo khóa phe nên không chậm hơn. Chủ tướng to hơn (×1,25), có mũ, vũ khí, tóc râu và áo choàng riêng, có biển tên. Nhiều tướng cưỡi ngựa, trâu hoặc voi (chỉ để trang trí, không đổi chỉ số).

**Lối chơi:** mỗi phe có một quân độc quyền, thêm đặc tính thứ hai (ngoài đặc tính cũ) và một kỹ năng chủ tướng có thời gian hồi. Kết đồng minh với một sứ quân thì tuyển được quân độc quyền của họ. AI cũng tuyển quân độc quyền, tuyển chủ tướng khi Đại Bản Doanh lên cấp II và dùng kỹ năng khi giao chiến. Chơi nhiều người có đồng bộ lệnh dùng kỹ năng. Xem bảng đầy đủ trong màn hình chọn phe và mục "Mười hai sứ quân" trong Binh thư.

Tệp mới: `warlords.js` (dữ liệu và luật), `warlords-ui.js` (thẻ chọn phe, Binh thư), `warlords.test.cjs`.

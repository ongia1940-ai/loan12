# Bản demo RTS góc chéo

## Multiplayer LAN, nhiều bản đồ và hạm đội

Màn chọn trận có chế độ đồng đội LAN tối đa 4 người. Chủ phòng chọn sứ quân và bản đồ rồi nhận mã 4 ký tự; máy khác mở cùng địa chỉ máy chủ, nhập mã để tham gia. Đây là co-op cùng điều khiển một lãnh địa: lệnh di chuyển, khai thác, xây dựng, tuyển quân, nâng cấp, nghiên cứu, tập kết và vận tải được chuyển qua máy chủ local theo số thứ tự. Phòng tồn tại trong bộ nhớ và mất khi tắt máy chủ; chưa có tài khoản, máy chủ công cộng, lưu trận hoặc cơ chế khôi phục sai lệch dài hạn.

Có 4 bản đồ 84×60: **Đồng Bằng Hoa Lư** cân bằng, **Châu Thổ Tam Giang** thiên thủy chiến, **Sơn Cước Phong Châu** nhiều đồi/rừng và **Duyên Hải Bố Hải** thiên đổ bộ. Bộ tạo bản đồ bảo vệ vị trí công trình, quân và mỏ ban đầu; luật kinh tế hữu hạn không thay đổi.

Thủy Xưởng có thêm **Hỏa Thuyền Hổ** (cấp II, đánh lan), **Thuyền Lầu Vận Binh** (cấp II, 10 chỗ) và **Chiến Hạm Lâu Thuyền** (cấp III, hai phát, tầm xa). Hình thuyền được dựng bằng Canvas nhiều lớp: thân/boong, mui, lâu thuyền, cột và dây buồm, đầu thú, sóng đuôi cùng hiệu ứng lửa. Đây là 2.5D vector vẽ bằng mã, không phải mô hình 3D polygon.

## Giao diện vương quốc và AI phát triển

Màn hình chọn phe dạng thẻ, minh họa thủ lĩnh vector riêng, màu xanh/vàng, bảng nhiệm vụ và thanh tình báo lấy cảm hứng bố cục ảnh tham khảo. Không dùng tài sản game Rise of Kingdoms; vẫn là bản đồ Canvas 2.5D, chưa đạt chất lượng mô hình 3D của game thương mại.

11 AI có kho riêng (350 Lương, 300 Gỗ, 180 Đá, 100 Vàng, 80 Sắt ban đầu), nhà dân, ruộng và 5 dân phu. Thu nhập chỉ đến sau khai thác và nộp hàng, không cộng vào kho người chơi. AI xây nhà theo thời gian, nâng nhà chính/doanh trại, tuyển có chi phí và dân số; tối đa 7 thợ, khoảng 22 quân chiến đấu mỗi phe. Học thuyết phe quyết định quân ưu tiên: nỏ, voi, kích, giáp sĩ, cung, đao hoặc thủy quân; Trần Lãm tự tìm ô nước gần căn cứ để dựng Thủy Xưởng và đóng thuyền. Sau 150 giây có thể cử tối đa 6 quân mỗi đợt nếu đủ lực lượng, cách tối thiểu 110 giây. Đã tắt đợt sinh quân miễn phí của bản cũ. AI ra quyết định luân phiên để giảm tải. Bảng Tình báo có 11 thẻ, hiển thị cấp nhà, quân/dân, thanh sức mạnh, công trình, hành động và tài nguyên đã vận chuyển; bấm một thẻ để đưa camera tới căn cứ đó. AI dừng sau bị thu phục/đánh bại. Chưa có ngoại giao, chiến tranh giữa AI hoặc cây nghiên cứu riêng cho AI.

## Chọn sứ quân / ngẫu nhiên

Màn hình bắt đầu cho chọn một trong 12 sứ quân hoặc bốc ngẫu nhiên đều. Mở danh sách ngay dưới lựa chọn để đọc toàn bộ đặc tính. Phe đối thủ cũng nhận đặc tính riêng. Lựa chọn khóa sau khi bắt đầu; Hướng dẫn chỉ tạm dừng/tiếp tục, không bốc lại. Chơi lại sau kết thúc sẽ mở màn hình chọn phe; lựa chọn ngẫu nhiên bốc mới khi bắt đầu.

Vị trí xuất phát và cây nhà/Danh Tướng hiện tại dùng chung cho các phe. Đổi phe hoán đổi danh tính của hai vị trí sở hữu để không có phe trùng; không đổi cả địa hình hay tạo 12 bộ tướng mới. Phe gốc tự mở quyền tuyển quân bản địa (vẫn cần cấp nhà, tài nguyên và dân số). Thu phục không cộng dồn đặc tính phe; quân đổi chủ nhận đặc tính phe mới. Đặc tính và chức năng là quy ước gameplay giả tưởng, không phải khẳng định lịch sử. Chi tiết định lượng nằm trong `factions.js`; kiểm thử bằng `node --test loan12-web/factions.test.cjs`.

## Chi tiết đồ họa

Thêm bờ sông cát và mép nước, cỏ/lau, sỏi đồi và vũng bùn; sân đất và lối vào công trình; đường ngói, cửa sổ song, móng đá, bậc thềm, chum nước và đèn. Nhà dưới 50% HP có vết nứt và khói. Cây thêm lá nhiều lớp và chuyển động nhẹ, mỏ thêm vân nứt và đá vụn. Nút **Chi tiết: Bật/Tắt** trên thanh đầu giảm các lớp trang trí phụ; chi tiết tự giảm khi zoom xa. Chỉ thay đổi hiển thị, không đổi tài nguyên, va chạm hoặc chỉ số chiến đấu.

## Chiến trường mở rộng

Bản đồ 84×60 (5.040 ô, gấp 2,17 lần bản 58×40). Giữ Hoa Lư và Đường Lâm; dời sáu căn cứ xa về đông/nam/bắc, thêm 18 lính phòng thủ thuộc ba binh chủng mới. Sáu cụm rừng/mỏ mới, đồi phía đông và bùn/lau phía nam. Dùng hộp chọn vùng dưới tiêu đề hoặc minimap để di chuyển camera. Dân số vẫn phụ thuộc nhà dân và cấp nhà chính; không cấp miễn phí quân hoặc tài nguyên.

- Cung Thủ Làng: Trường Bắn I, 40 Lương/35 Gỗ, 45 HP, 6 sát thương, tầm 5.
- Lính Lao: Võ Doanh I, 35 Lương/25 Gỗ, 65 HP, 5 sát thương, tầm 4, giáp tên 3.
- Đao Binh: Võ Doanh II, 65 Lương/20 Sắt, 110 HP, 11 sát thương, giáp chém 2.

Mỗi loại 1 dân; chỉ số trên là gốc trước thưởng cấp, nghiên cứu và nhịp chiến đấu. Mở Binh thư xem hình. Kiểm thử mở rộng: `node --test loan12-web/expansion.test.cjs`.

## Dân phu, binh lính và Sĩ Phu

Voi chiến và máy bắn đá có tạo hình lớn riêng (bành voi, quản tượng, ngà; bánh xe và khung cần phóng). Mở **Binh thư** để xem hình và điều kiện tuyển từng loại. Voi: Võ Doanh II + thu phục Kiều Thuận, 180 Lương/120 Vàng, 4 dân. Máy bắn đá: Trường Bắn & Cơ Khí II, 100 Gỗ/40 Đá/60 Sắt, 3 dân. Không cấp miễn phí hoặc bỏ điều kiện công nghệ. Kiểm thử: `node --test loan12-web/army-art.test.cjs`.

Dân phu mặc áo vải, đội nón lá, đổi dụng cụ theo ngành khai thác và đeo túi hàng. Dân binh quấn khăn, kích binh cầm giáo dài, giáp sĩ có giáp phiến và khiên. Cấp quân II/III có dấu cấp trên đai. Đây là tạo hình cách điệu lấy cảm hứng Việt cổ, không phải phục dựng trang phục lịch sử.

Sĩ Phu tuyển tại Soái Phủ cấp I: 80 Lương + 50 Vàng, 1 dân, 65 HP gốc, không tấn công. Khi đứng yên và không choáng, hồi 2 HP/s cho một đồng minh bộ hành trong 4 ô có đường nhìn, sau 5 giây ngoài giao tranh. Không chữa bản thân, thuyền/máy bắn đá hoặc cộng dồn nhiều sĩ phu lên cùng bệnh nhân. Vai trò chữa thương là quy ước gameplay, không phải mô tả nghề nghiệp lịch sử. Kiểm thử riêng: `node --test loan12-web/scholar.test.cjs`.

Chạy: `node loan12-web/server.cjs`, mở http://127.0.0.1:4180/.

- Đồ họa Canvas isometric, công trình mái gỗ/ngói, ruộng hữu hạn, cây và quặng; tài sản tự vẽ bằng mã, không lấy từ AoE hay StarCraft.
- Dân phu phải khai thác, mang tối đa 20 hàng, về nhà chính/nhà dân/kho mới cộng tài nguyên. Không có thu nhập thụ động.
- Ba cấp nhà chính: Làng Việt, Quân Trấn, Thành Lũy. Cơ chế nâng cấp, nghiên cứu, dân số và danh tướng giữ nguyên.
- Quân (không gồm dân phu) di chuyển ×1,35, chu kỳ đánh ×0,8. Áp dụng cho cả hai phe.
- Ctrl+1–5 lưu nhóm; 1–5 gọi nhóm. H giữ vị trí; X dừng; A rồi click tiến công. Chuột phải ra lệnh. Phím mũi tên/WASD di chuyển camera (A dành cho tiến công khi đã chọn quân).
- Chọn nhà tuyển quân, chuột phải đặt điểm tập kết. Nhà Dân có thể tập kết tới nguồn khai thác để thợ mới nhận việc.
- Minimap vẫn nhìn từ trên xuống, đường viền hiển thị vùng camera góc chéo.

Kiểm thử: `node --test loan12-web/tests.cjs loan12-web/progression.test.cjs loan12-web/economy.test.cjs loan12-web/tactics.test.cjs`.

Đây là prototype, không phải bản sao hai trò chơi: chưa có multiplayer, lưu trận, sương mù chiến tranh hoặc AI phát triển kinh tế hoàn chỉnh. Công trình vẫn thi công theo thời gian, chưa cần dân đứng xây. Không thay đổi game web gốc hay dự án Unity.
